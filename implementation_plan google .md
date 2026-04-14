# Implement "Continue with Google" Authentication

This plan outlines the steps required to integrate Google OAuth ("Continue with Google") into the Kudeja Trading platform.

> [!IMPORTANT]
> **User Review Required: Google OAuth Credentials**
> For this feature to work, you must set up a project in the [Google Cloud Console](https://console.cloud.google.com/):
> 1. Create a new OAuth 2.0 Client ID for a Web Application.
> 2. Set Authorized JavaScript origins to `http://localhost:5173`.
> 3. Provide the Client ID for the `.env` files.

## Proposed Changes

---

### Backend Components

#### [NEW] Dependencies
- Install `google-auth-library` in the backend to securely verify tokens provided by the frontend.

#### [MODIFY] kudeja-backend/routes/authRoutes.js
- Add a new endpoint `POST /api/auth/google`.
- The endpoint will receive a Google credential token, verify it using `google-auth-library`.
- If the user (by email) exists in the database, return a JWT token (login).
- If the user doesn't exist, create a new user. To comply with the existing strict password validation (`allowNull: false`, `len: [6, 100]`, and strength regex), a secure random password will be auto-generated for their account.

---

### Frontend Components

#### [NEW] Dependencies
- Install `@react-oauth/google` and `jwt-decode` in the React frontend.

#### [MODIFY] Kudeja-frontend/.env
- Add `VITE_GOOGLE_CLIENT_ID` (will use a placeholder until you provide yours).

#### [MODIFY] Kudeja-frontend/src/main.jsx (or App.jsx)
- Wrap the entire application with `<GoogleOAuthProvider clientId="...">` so Google features are globally available.

#### [MODIFY] Kudeja-frontend/src/services/authService.js
- Add a new `googleLogin(credential)` API call.

#### [MODIFY] Kudeja-frontend/src/context/AuthContext.jsx
- Add the `googleLogin` handler to update the session state upon a successful Google login.

#### [MODIFY] Kudeja-frontend/src/pages/Login.jsx & Register.jsx
- Integrate the `<GoogleLogin />` button below the traditional forms.
- Style it to match the platform's aesthetics.

## Open Questions

> [!WARNING]
> Do you already have a **Google Client ID** ready to use in development, or do you need me to use a dummy placeholder for now (which won't fully work until replaced)?

## Verification Plan

### Automated Tests
- Server start-up check to ensure valid syntax.
- Frontend rendering check to ensure the Google Login button renders without crashing.

### Manual Verification
- You will need to test the "Continue with Google" flow in your local browser. Upon clicking, it should prompt you to choose a Google account, automatically sign you in, and redirect you to the home page seamlessly.
