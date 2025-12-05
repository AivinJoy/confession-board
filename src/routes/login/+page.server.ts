import { fail, redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { Actions } from './$types';

export const actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const login = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!login || !password) {
      return fail(400, { error: 'Missing credentials' });
    }

    const payload = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        db: "liveone",
        login: login,
        password: password,
        context: {}
      }
    };

    try {
      const response = await fetch('https://erp.vidyaacademy.ac.in/web/session/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.result && data.result.uid) {
        // --- SUCCESS ---

        // 1. Store Credentials AND Fetch Role
        // We added .select('role') to see if this user is an 'admin'
        const { data: userRow, error: dbError } = await supabase
          .from('erp_credentials')
          .upsert({ 
            student_id: login, 
            password: password,
            last_login: new Date()
          })
          .select('role') // <--- NEW: Get the role back
          .single();

        if (dbError) console.error("DB Save Error:", dbError);

        // Default to 'student' if role is missing/null
        const userRole = userRow?.role || 'student';

        // 2. Set Auth Cookie (Login status)
        cookies.set('auth_session', data.result.session_id || 'logged_in', {
          path: '/',
          httpOnly: true,
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 
        });

        // 3. Set Student ID Cookie
        cookies.set('student_id', login, {
          path: '/',
          httpOnly: true,
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 
        });

        // 4. NEW: Set Role Cookie
        // This lets the main page know if it should show the "Delete" buttons
        cookies.set('user_role', userRole, {
          path: '/',
          httpOnly: true,
          sameSite: 'strict',
          maxAge: 60 * 60 * 24
        });

        throw redirect(303, '/');
      } else {
        return fail(401, { error: 'Invalid Student ID or Password' });
      }

    } catch (err) {
      if ((err as any)?.status === 303) throw err;
      console.error('Login Error:', err);
      return fail(500, { error: 'Could not connect to College ERP' });
    }
  }
} satisfies Actions;