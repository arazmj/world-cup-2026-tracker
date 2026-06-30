// Public configuration. The Microsoft clientId is NOT a secret (it's a public SPA app id).
export const MS_CLIENT_ID = 'cd46d082-3643-45b4-bb22-3ece538b5695';
export const MS_AUTHORITY = 'https://login.microsoftonline.com/common';
export const MS_SCOPES = ['User.Read', 'openid', 'profile', 'email'];

// Google sign-in turns on automatically once a client id is provided at build time
// (VITE_GOOGLE_CLIENT_ID). Apple needs a paid Apple Developer account; see README.
export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || '';

export type AuthProviderId = 'microsoft' | 'google' | 'apple';
