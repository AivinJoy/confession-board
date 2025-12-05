import { supabase } from '$lib/supabaseClient';
import { adminSupabase } from '$lib/server/privateSupabase';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

export async function GET({ request }) {
  // 1. SECURITY: Check for the Secret Key (So hackers don't spam your IG)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. FIND ELIGIBLE POSTS
  // Logic: Not posted yet AND created more than 2 minutes ago
  // 2. FIND ELIGIBLE POSTS
  // Logic: 
  // 1. Not posted yet
  // 2. Older than 2 minutes (Wait time)
  // 3. Newer than 24 hours (SAFETY: Don't touch ancient posts)
  
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // <--- NEW

  const { data: posts, error } = await supabase
    .from('confessions')
    .select('*')
    .eq('posted_to_instagram', false)
    .lt('created_at', twoMinutesAgo)     // Must be older than 2 mins
    .gt('created_at', twentyFourHoursAgo) // <--- Must be newer than 24 hours
    .limit(1);

  if (error || !posts || posts.length === 0) {
    return json({ message: 'No posts ready for Instagram.' });
  }

  const post = posts[0];
  const imageUrl = post.image_url;
  const caption = `${post.content}\n\n#vastconfessions #anonymous`;

  try {
    // 3. UPLOAD TO INSTAGRAM CONTAINER
    const containerRes = await fetch(
      `https://graph.facebook.com/v18.0/${env.INSTAGRAM_ACCOUNT_ID}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${env.INSTAGRAM_ACCESS_TOKEN}`,
      { method: 'POST' }
    );
    const containerData = await containerRes.json();
    
    if (!containerData.id) {
      throw new Error(`IG Container Error: ${JSON.stringify(containerData)}`);
    }

    // 4. PUBLISH THE CONTAINER
    const publishRes = await fetch(
      `https://graph.facebook.com/v18.0/${env.INSTAGRAM_ACCOUNT_ID}/media_publish?creation_id=${containerData.id}&access_token=${env.INSTAGRAM_ACCESS_TOKEN}`,
      { method: 'POST' }
    );
    const publishData = await publishRes.json();

    if (!publishData.id) {
      throw new Error(`IG Publish Error: ${JSON.stringify(publishData)}`);
    }

    // 5. SUCCESS: UPDATE DB & CLEANUP
    
    // A. Mark as posted
    await adminSupabase
      .from('confessions')
      .update({ posted_to_instagram: true })
      .eq('id', post.id);

    // B. DELETE FROM BUCKET (As requested)
    // WARNING: This breaks the image on your website board!
    // If you want the image to stay on the website, REMOVE THIS BLOCK.
    const fileName = imageUrl.split('/').pop(); // Extract filename from URL
    if (fileName) {
       await adminSupabase.storage
        .from('confession-images')
        .remove([fileName]);
    }

    return json({ success: true, postId: post.id, igId: publishData.id });

  } catch (err: any) {
    console.error(err);
    return json({ error: err.message }, { status: 500 });
  }
}