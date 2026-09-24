import { getGoogleUser } from "@/app/auth/google/googleOauthUtils";
import { connectToDB } from "@/app/api/databases/db";
import { buildProfileIdFromEmail } from "@/app/lib/profile-id";
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const returnedState = searchParams.get('state');
    const cookieStore = await cookies();
    const expectedState = cookieStore.get('oauth_state')?.value;

    if (!code || !returnedState || !expectedState || returnedState !== expectedState) {
        return NextResponse.json({ error: "Invalid OAuth request" }, { status: 400 });
    }

    cookieStore.delete('oauth_state');

    try {
        const oauthUserInfo = await getGoogleUser(code);

        const allowedEmails = (process.env.AUTHORIZED_EMAILS || "")
            .split(",")
            .map((email) => email.trim().toLowerCase())
            .filter(Boolean);

        const allowedPhysicianSpecialist = (process.env.PHYSICIAN_SPECIALIST_EMAILS || "")
            .split(",")
            .map((email) => email.trim().toLowerCase())
            .filter(Boolean);

        const editorEmails = (process.env.EDITOR_EMAILS || "")
            .split(",")
            .map((email) => email.trim().toLowerCase())
            .filter(Boolean);

            const email = oauthUserInfo.email?.trim().toLowerCase();

            const isAuthorized = allowedEmails.includes(email);
            const isPhysicianSpecialist = allowedPhysicianSpecialist.includes(email);

            if (!email || (!isAuthorized && !isPhysicianSpecialist)) {
            return NextResponse.redirect(
                new URL("/login-unauthorizedAccount", request.url)
            );
        }
        
        const { db } = await connectToDB();

        let user = await db.collection('users').findOne({ email: oauthUserInfo.email });

                if (!user) {
            const newUser = {
                username: oauthUserInfo.name,
                email: oauthUserInfo.email,
                picture: oauthUserInfo.picture,
                googleId: oauthUserInfo.id,
                isEditor: editorEmails.includes(email),
                profileId: buildProfileIdFromEmail(oauthUserInfo.email)
            };
            const result = await db.collection('users').insertOne(newUser);
            user = await db.collection('users').findOne({ _id: result.insertedId });
        } else {
            const updates = {
                username: oauthUserInfo.name,
                picture: oauthUserInfo.picture,
                isEditor: editorEmails.includes(email)
            };

            if (!user.profileId) {
                updates.profileId = buildProfileIdFromEmail(oauthUserInfo.email);
            }

            await db.collection('users').updateOne(
                { _id: user._id },
                { $set: updates }
            );

            if (updates.profileId) {
                user.profileId = updates.profileId;
            }
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const alg = 'HS256';

        const jwt = await new SignJWT({
            userId: user._id.toString(),
            email: email,
            name: oauthUserInfo.name,
            picture: oauthUserInfo.picture,
        })
            .setProtectedHeader({ alg })
            .setExpirationTime("1h")
            .sign(secret);
        
        cookieStore.set('session', jwt, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60,
            path: '/'
        });

        return NextResponse.redirect(new URL('/', request.url));

    } catch (error) {
        console.error("OAuth Error:", error);
        return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    }
}