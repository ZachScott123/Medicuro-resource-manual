"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BackButton from "@/app/lib/back-button";

export default function PhysicianPage() {
  let physicianImage = "/default-profile-physician.svg";

  const { id } = useParams();
  const [physician, setPhysician] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/physician")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load physician profile.");
        return response.json();
      })
      .then((records) => setPhysician(records.find((item) => item.id === id)))
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <span/>;
  }

  if (hasError || !physician) {
    if (hasError) {
      return (
        <div className="manager-login-action" role="alert">
          <button className="btn-accent-continue" onClick={() => router.push("/login")} type="button">
            Please Login to Continue
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-8 text-center">
          <p className="text-lg font-semibold">
            {hasError ? "Unable to load physician profile." : "Physician not found."}
          </p>
          <Link href="/physician-partners" className="btn-accent inline-block mt-4">
            Physician Partners
          </Link>
        </div>
      </div>
    );
  }

  if (physician.imageUrl) {
    physicianImage = physician.imageUrl;
  }

  return (
    <main className="profile-detail">
      <article className="profile-detail-card">
        <header className="profile-detail-header">
          <BackButton />

          <h1>{physician.name}</h1>
          <p className="profile-detail-role">{physician.position}</p>
        </header>

        <div className="profile-detail-main">
          <div className="profile-detail-image">
            <img src={physicianImage} alt={physician.name} onError={(event) => { event.currentTarget.src = "/default-profile-physician.svg"; }} />
          
            <div>
              <dl className="profile-detail-contact">
                <div><dt>Email</dt><dd>{physician.email}</dd></div>
                <div><dt>Phone</dt><dd>{physician.phone}</dd></div>
                <div><dt>Location</dt><dd>{physician.location}</dd></div>
              </dl>
            </div>
          </div>

          <div className="profile-detail-info">
            <section className="profile-detail-about" aria-labelledby="physician-about">
              <h2 id="physician-about">About</h2>
              <p>{physician.about || "No additional information has been provided."}</p>
            </section>
          </div>
        </div>

      </article>
    </main>
  );
}
