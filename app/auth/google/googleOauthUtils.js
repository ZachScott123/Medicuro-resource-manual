import { google } from "googleapis";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";

const oauthClient = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_SECRET,
    process.env.GOOGLE_REDIRECT
)

export const getGoogleOauthUrl = async () => {
    const scopes = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
    ]

    const state = randomUUID();
    const cookieStore = await cookies();
    cookieStore.set("oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/"
    });

    return oauthClient.generateAuthUrl( {
        access_type: "offline",
        prompt: "consent",
        scope: scopes,
        state
    })
}

export const getGoogleUser = async (code) => {
    const {tokens} = await oauthClient.getToken(code);
    if (!tokens.access_token) throw new Error("Google did not return an access token.");

    const response = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
        cache: "no-store"
    });
    if (!response.ok) throw new Error("Unable to load Google account information.");

    const userInfo = await response.json();
    
    return userInfo;
}