import { supabase } from '$lib/supabaseClient';
import { adminSupabase } from '$lib/server/privateSupabase'; // CRITICAL IMPORT
import { generateStickyImage } from '$lib/server/imageGenerator';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const TABLE_NAME = 'confessions';
// Make sure this matches your bucket name exactly (plural/singular)
const BUCKET_NAME = 'confession-images'; 

// --- LOAD FUNCTION ---
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

  return { 
    rawConfessions: rawConfessions ?? [],
    currentUser: studentId,
    userRole: userRole
  };
};

// --- HELPER: CHECK PERMISSIONS ---
async function checkPermissions(postId: string, cookies: any) {
  const studentId = cookies.get('student_id');
  const userRole = cookies.get('user_role');

  if (!studentId) return { allowed: false, error: 'Not logged in' };

  const { data: post } = await adminSupabase
    .from(TABLE_NAME)
    .select('student_id, created_at')
    .eq('id', postId)
    .single();

  if (!post) return { allowed: false, error: 'Post not found' };

  const isOwner = post.student_id === studentId;
  const isAdmin = userRole === 'admin';

  let timeString = post.created_at;
  if (!timeString.endsWith('Z') && !timeString.includes('+')) {
    timeString += 'Z'; 
  }
  
  const postTime = new Date(timeString).getTime();
  const minutesDiff = (Date.now() - postTime) / 1000 / 60;

  if (isAdmin || (isOwner && minutesDiff <= 2)) {
    return { allowed: true };
  } else {
    return { allowed: false, error: 'Time limit exceeded or unauthorized' };
  }
}

export const actions = {
  // --- CREATE ACTION (FIXED) ---
  create: async ({ request, cookies }) => {
    const formData = await request.formData();
    const content = formData.get('content') as string;
    const color = formData.get('color') as string;
    const studentId = cookies.get('student_id');

    if (!content || !color) return fail(400, { error: 'Missing data' });

    // 1. Insert into DB (Standard client is fine here due to RLS policy)
    const { data: insertedData, error: dbError } = await supabase
      .from(TABLE_NAME)
      .insert([{ content, color, student_id: studentId }])
      .select()
      .single();

    if (dbError || !insertedData) {
      console.error("DB Insert Error:", dbError);
      return fail(500, { error: 'Database error' });
    }

    const realId = insertedData.id;

    // 2. Generate & Upload Image
    try {
      const imageBuffer = await generateStickyImage(content, color, realId);
      const fileName = `${realId}_${Date.now()}.png`;

      // Upload to Storage (Standard client is fine if bucket is public)
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME) 
        .upload(fileName, imageBuffer, { contentType: 'image/png' });

      if (uploadError) {
        console.error("Storage Upload Error:", uploadError);
      } else {
        // 3. Get Public URL
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName);

        // 4. UPDATE DB WITH URL (MUST USE ADMIN CLIENT)
        // We use adminSupabase here to bypass "No Anonymous Updates" RLS rule
        const { error: updateError } = await adminSupabase
          .from(TABLE_NAME)
          .update({ image_url: urlData.publicUrl })
          .eq('id', realId);

        if (updateError) {
          console.error("Failed to save Image URL to DB:", updateError);
        } else {
          console.log("Image URL saved successfully for ID:", realId);
        }
      }
    } catch (e) {
      console.error("Image gen failed:", e);
    }

    return { success: true };
  },

  // --- DELETE ACTION ---
  delete: async ({ request, cookies }) => {
    const formData = await request.formData();
    const id = formData.get('id') as string;

    const perm = await checkPermissions(id, cookies);
    if (!perm.allowed) return fail(403, { error: perm.error });

    const { error } = await adminSupabase.from(TABLE_NAME).delete().eq('id', id);
    
    if (error) return fail(500, { error: 'Delete failed' });
    return { success: true };
  },

  // --- UPDATE ACTION ---
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