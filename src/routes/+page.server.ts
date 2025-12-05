import { supabase } from '$lib/supabaseClient';
import { adminSupabase } from '$lib/server/privateSupabase'; 
import { generateStickyImage } from '$lib/server/imageGenerator';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const TABLE_NAME = 'confessions';
const BUCKET_NAME = 'confession-images';

// --- 1. LOAD FUNCTION (This was missing the user data!) ---
export const load: PageServerLoad = async ({ cookies }) => {
  const session = cookies.get('auth_session');
  const studentId = cookies.get('student_id');
  const userRole = cookies.get('user_role');

  if (!session) {
    throw redirect(303, '/login');
  }

  const { data: rawConfessions, error } = await supabase
    .from(TABLE_NAME)
    .select('id, content, color, created_at, student_id') 
    .order('id', { ascending: false });

  if (error) {
    console.error('Error fetching confessions:', error);
    return { rawConfessions: [] };
  }

  // PASS THE USER DATA TO THE FRONTEND
  return { 
    rawConfessions: rawConfessions ?? [],
    currentUser: studentId, // <--- This was undefined before
    userRole: userRole      // <--- This was undefined before
  };
};

// --- 2. HELPER: CHECK PERMISSIONS ---
// --- HELPER: CHECK PERMISSIONS ---
async function checkPermissions(postId: string, cookies: any) {
  const studentId = cookies.get('student_id');
  const userRole = cookies.get('user_role');

  if (!studentId) return { allowed: false, error: 'Not logged in' };

  // Fetch the specific post
  const { data: post } = await adminSupabase
    .from(TABLE_NAME)
    .select('student_id, created_at')
    .eq('id', postId)
    .single();

  if (!post) return { allowed: false, error: 'Post not found' };

  const isOwner = post.student_id === studentId;
  const isAdmin = userRole === 'admin';

  // --- TIMEZONE FIX START ---
  // Ensure the date string is treated as UTC
  let timeString = post.created_at;
  if (!timeString.endsWith('Z') && !timeString.includes('+')) {
    timeString += 'Z'; 
  }
  
  const postTime = new Date(timeString).getTime();
  const minutesDiff = (Date.now() - postTime) / 1000 / 60;
  // --- TIMEZONE FIX END ---

  // Log for debugging (Check your terminal to see this)
  console.log(`Server Check - Owner: ${isOwner}, Admin: ${isAdmin}, Mins: ${minutesDiff.toFixed(2)}`);

  if (isAdmin || (isOwner && minutesDiff <= 2)) {
    return { allowed: true };
  } else {
    return { allowed: false, error: 'Time limit exceeded or unauthorized' };
  }
}

export const actions = {
  // --- CREATE ---
  create: async ({ request, cookies }) => {
    const formData = await request.formData();
    const content = formData.get('content') as string;
    const color = formData.get('color') as string;
    const studentId = cookies.get('student_id');

    if (!content || !color) return fail(400, { error: 'Missing data' });

    const { data: insertedData, error: dbError } = await supabase
      .from(TABLE_NAME)
      .insert([{ content, color, student_id: studentId }])
      .select()
      .single();

    if (dbError || !insertedData) {
      console.error(dbError);
      return fail(500, { error: 'Database error' });
    }

    const realId = insertedData.id;
    try {
      const imageBuffer = await generateStickyImage(content, color, realId);
      const fileName = `${realId}_${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME) 
        .upload(fileName, imageBuffer, { contentType: 'image/png' });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName);

        await supabase
          .from(TABLE_NAME)
          .update({ image_url: urlData.publicUrl })
          .eq('id', realId);
      }
    } catch (e) {
      console.error("Image gen failed:", e);
    }

    return { success: true };
  },

  // --- DELETE ---
  delete: async ({ request, cookies }) => {
    const formData = await request.formData();
    const id = formData.get('id') as string;

    const perm = await checkPermissions(id, cookies);
    if (!perm.allowed) return fail(403, { error: perm.error });

    const { error } = await adminSupabase.from(TABLE_NAME).delete().eq('id', id);
    
    if (error) return fail(500, { error: 'Delete failed' });
    return { success: true };
  },

  // --- UPDATE ---
  update: async ({ request, cookies }) => {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const content = formData.get('content') as string;
    const color = formData.get('color') as string;

    const perm = await checkPermissions(id, cookies);
    if (!perm.allowed) return fail(403, { error: perm.error });

    const imageBuffer = await generateStickyImage(content, color, parseInt(id));
    const fileName = `${id}_${Date.now()}.png`;

    await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, imageBuffer, { upsert: true, contentType: 'image/png' });
    
    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

    const { error } = await adminSupabase
      .from(TABLE_NAME)
      .update({ content, color, image_url: urlData.publicUrl })
      .eq('id', id);

    if (error) return fail(500, { error: 'Update failed' });
    return { success: true };
  }

} satisfies Actions;