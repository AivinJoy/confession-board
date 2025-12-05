import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

// Add '!' to ensure TypeScript knows these keys exist
const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL!;
const serviceRoleKey = env.PRIVATE_SUPABASE_SERVICE_ROLE!;

// This "admin" client has full power to Delete/Update anything
export const adminSupabase = createClient(supabaseUrl, serviceRoleKey);