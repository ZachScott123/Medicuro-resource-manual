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
            <div className="login-panel-unauthorized">
                <span className="unauthorized-code">ERROR 401</span>
                <h1 className="login-title-unauthorized">Unauthorized Login Attempt</h1>

                <p className="login-description-unauthorized">Returning to home page in <strong>{secondsRemaining}</strong></p>
            </div>
            <img
            className="unauthorized-art"
            src="/medicuro-unauthorized-page.png"
            alt="A person using laptop with lock symbol"
            />
        </main>
    )
}