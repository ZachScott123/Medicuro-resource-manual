"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Unauthorized() {
    const router = useRouter();
    const [secondsRemaining, setSecondsRemaining] = useState(5);

    useEffect(() => {
        const redirectTimeout = window.setTimeout(() => {
            router.replace("/");
        }, 5000);

        const countdownInterval = window.setInterval(() => {
            setSecondsRemaining((current) => Math.max(current - 1, 0));
        }, 1000);

        return () => {
            window.clearTimeout(redirectTimeout);
            window.clearInterval(countdownInterval);
        };
    }, [router]);

    return (
        <main className="login-page-unauthorized">
            <section className="login-panel-unauthorized" aria-labelledby="login-title">
                <p className="unauthorized-eyebrow">Access restricted</p>
                <h1 id="login-title-unauthorized">Unauthorized Account</h1>
                <p className="login-description-unauthorized">This account is not authorized to access the Medicuro internal reference manual.</p>
                <p className="unauthorized-redirect">Returning to home page in <strong>{secondsRemaining}</strong></p>
            </section>
        </main>
    )
}