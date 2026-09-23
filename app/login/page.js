import { redirect } from 'next/navigation'
import { getGoogleOauthUrl } from '@/app/auth/google/googleOauthUtils';
import BackButton from '@/app/lib/back-button';

async function handleLoginAction() {
    "use server"
    const redirectURL = await getGoogleOauthUrl();
    redirect(redirectURL);
}

export default function LoginPage() {
    return (
        <main className="login-page">
            <section className="login-panel" aria-labelledby="login-title">
                <BackButton />
                <p className="login-eyebrow">Login</p>
                <h1 id="login-title">Welcome</h1>
                <p className="login-description">Please log in to access Medicuro Internal Resource services.</p>
            <form action={handleLoginAction}>
                <button className="btn-accent login-button" type="submit">
                    <img src="/google-icon-logo.svg" alt="" className="google-logo" />
                    Login with Google
                </button>
            </form>
            </section>
        </main>
    )
}