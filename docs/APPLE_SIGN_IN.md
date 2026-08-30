# Sign in with Apple

Year Mission uses Supabase Auth's Apple OAuth provider for web/PWA sign-in. The application code sends users through `supabase.auth.signInWithOAuth({ provider: "apple" })` and returns to the existing PKCE callback at `/auth/callback?next=/`.

## Required Apple Developer configuration

1. Enable **Sign in with Apple** on the Year Mission App ID in Certificates, Identifiers & Profiles.
2. Create a **Services ID** for the Year Mission website and associate it with that primary App ID.
3. Configure the production website domain for the Services ID.
4. Register the Supabase Apple OAuth callback URL shown by the Supabase dashboard as an Apple return URL. Apple requires an absolute HTTPS return URL and does not accept localhost.
5. Create a Sign in with Apple private key and record its Key ID and Apple Developer Team ID. Treat the `.p8` key as a secret and never commit it to this repository.

## Required Supabase configuration

In **Authentication → Providers → Apple** for the production Supabase project:

1. Enable Apple.
2. Set **Client IDs** with the web Services ID first. If native Sign in with Apple is also enabled later, add the native App ID after the Services ID.
3. Configure the Apple secret generated from the Apple private key, Key ID, Team ID, and Services ID according to the current Supabase Apple provider instructions.
4. In **Authentication → URL Configuration**, allow:
   - `https://year-mission.vercel.app/auth/callback`
   - any deliberate preview callback origins used for testing.

The browser supplies `redirectTo` as `${window.location.origin}/auth/callback?next=/`; only origins on the Supabase redirect allow list will be accepted.

## Verification checklist

- Open `/login` in Safari and in the installed PWA.
- Tap **Continue with Apple**.
- Complete Apple consent with both normal email sharing and **Hide My Email** if available.
- Confirm the flow returns to `/` with an authenticated Supabase session.
- Sign out and sign in again; confirm the same Supabase user is reused.
- Confirm Google sign-in still works.
- Confirm callback failures return to `/login` with a provider-neutral error.

## Notes

Apple's OAuth web flow does not provide the user's full name through the normal Supabase OAuth exchange. Do not make application behavior depend on Apple profile names. The email may be an Apple private relay address when the user chooses Hide My Email.
