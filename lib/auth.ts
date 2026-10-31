import { supabase } from '@/lib/supabase';

/** The app URL Supabase should return to after Google/email confirmation. */
export function getAuthCallbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getAuthCallbackUrl(),
      queryParams: { prompt: 'select_account' },
    },
  });
}

/**
 * Turns the most common Supabase/Google OAuth errors into setup instructions.
 * The raw message is kept for anything we do not recognise.
 */
export function googleAuthErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('provider is not enabled') ||
    normalized.includes('unsupported provider')
  ) {
    return 'Google sign-in is not enabled for this Supabase project. Open Supabase Dashboard → Authentication → Providers → Google, enable it, and add your Google OAuth Client ID and Client Secret.';
  }

  if (
    normalized.includes('invalid redirect') ||
    normalized.includes('redirect url')
  ) {
    return `The callback URL is not allowlisted. Add ${getAuthCallbackUrl()} to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.`;
  }

  if (
    normalized.includes('redirect_uri_mismatch') ||
    normalized.includes('redirect uri')
  ) {
    return 'Google rejected the redirect URI. In Google Cloud Console → APIs & Services → Credentials → your OAuth client, add https://<project-ref>.supabase.co/auth/v1/callback as an Authorized redirect URI. The app callback (/auth/callback) belongs in Supabase URL Configuration, not in Google Cloud.';
  }

  return message;
}
