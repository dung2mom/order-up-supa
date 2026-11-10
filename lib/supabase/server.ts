import { createServerClient, type CookieOptions } from '@supabase/ssr';

export type CookieStore = {
  getAll?: () =>
    | { name: string; value: string }[]
    | Promise<{ name: string; value: string }[] | null>
    | null;
  setAll?: (
    cookies: { name: string; value: string; options: CookieOptions }[],
    headers?: Record<string, string>
  ) => void | Promise<void>;
};

export function createClient(cookieStore?: CookieStore) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        if (!cookieStore?.getAll) {
          return [];
        }
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        try {
          cookieStore?.setAll?.(cookiesToSet, headers);
        } catch {
          // The `setAll` method was called from a Server Component or read-only context.
          // This can be ignored if middleware is refreshing user sessions.
        }
      },
    },
  });
}
