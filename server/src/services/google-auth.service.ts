/**
 * Google Sign-In (Google Identity Services) verification.
 *
 * The client-side GIS button hands the browser an ID token (JWT); we verify
 * it against Google's tokeninfo endpoint — Google checks the signature and
 * expiry server-side and returns the claims — then confirm it was issued for
 * OUR client id. No SDK dependency needed.
 *
 * Requires the GOOGLE_CLIENT_ID env var; the endpoint reports itself as
 * unconfigured without it (the client hides the button in that case too).
 */

const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

export interface GoogleUser {
  email: string;
  name?: string;
}

interface TokenInfo {
  aud?: string;
  email?: string;
  email_verified?: string; // "true" / "false" as strings
  name?: string;
  error_description?: string;
}

// Node 20 ships global fetch; @types/node 17 doesn't know about it.
const fetchFn = (globalThis as any).fetch as (
  url: string
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

const googleError = (message: string, status = 401) =>
  Object.assign(new Error(message), { status });

export const isGoogleAuthConfigured = (): boolean =>
  Boolean(process.env.GOOGLE_CLIENT_ID);

const verifyGoogleToken = async (credential: string): Promise<GoogleUser> => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw googleError('Google sign-in is not configured on this server.', 501);
  }

  const response = await fetchFn(
    `${TOKENINFO_URL}?id_token=${encodeURIComponent(credential)}`
  );
  const info = (await response.json()) as TokenInfo;

  if (!response.ok) {
    throw googleError('Google sign-in failed — invalid or expired token.');
  }
  if (info.aud !== clientId) {
    throw googleError('Google sign-in failed — token audience mismatch.');
  }
  if (!info.email || info.email_verified !== 'true') {
    throw googleError('Google sign-in requires a verified Google email.');
  }

  return { email: info.email.toLowerCase(), name: info.name };
};

export { verifyGoogleToken };
