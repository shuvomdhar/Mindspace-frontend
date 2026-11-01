import { supabase } from '@/lib/supabase';

/** The app URL Supabase should return to after Google/email confirmation. */
export function getAuthCallbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

/** The callback URL that sends a recovery link on to the reset-password form. */
export function getPasswordResetCallbackUrl(): string {
  return `${getAuthCallbackUrl()}?next=/reset-password`;
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

export async function sendPasswordResetEmail(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getPasswordResetCallbackUrl(),
  });
}

export async function resendConfirmationEmail(email: string) {
  return supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: getAuthCallbackUrl() },
  });
}

/** Actionable messages for email-confirmation and SMTP problems. */
export function emailAuthErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('email not confirmed')) {
    return 'Your email address is not confirmed yet. Check your inbox and spam folder, or resend the confirmation email below.';
  }

  if (
    normalized.includes('email_address_not_authorized') ||
    normalized.includes('not authorized')
  ) {
    return "Supabase's default email service can only deliver to project team members. Configure custom SMTP in Supabase under Authentication → Emails → SMTP Settings for real users.";
  }

  if (
    normalized.includes('over_email_send_rate_limit') ||
    normalized.includes('rate limit')
  ) {
    return "Supabase's default email service is limited to 2 emails per hour. Wait before trying again, or configure custom SMTP.";
  }

  if (normalized.includes('email_address_invalid')) {
    return 'Supabase rejected this email address. Check it for typos and use a valid address.';
  }

  if (normalized.includes('already confirmed')) {
    return 'This email address is already confirmed. Sign in with your password instead.';
  }

  if (normalized.includes('user not found')) {
    return 'No account exists for this email address. Create an account first.';
  }

  return message;
}

/** Only allow internal, relative paths from the `next` query parameter. */
export function safeNextPath(value: string | null): string {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  ) {
    return '/dashboard';
  }
  return value;
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
