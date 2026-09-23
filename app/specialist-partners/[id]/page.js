"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BackButton from "@/app/lib/back-button";

export default function SpecialistPage() {
  const { id } = useParams();
  const [specialist, setSpecialist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/specialist")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load specialist profile.");
        return response.json();
      })
      .then((records) => setSpecialist(records.find((item) => item.id === id)))
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <span/>;
  }

  if (hasError || !specialist) {
    if (hasError) {
      return (
        <div className="manager-login-action" role="alert">
          <button className="btn-accent-continue" onClick={() => router.push("/login")} type="button">
            Please Login to Continue
          </button>
        </div>
      );
    }

    return <div className="min-h-screen flex items-center justify-center"><div className="card p-8 text-center"><p className="text-lg font-semibold">{hasError ? "Unable to load specialist profile." : "Specialist not found."}</p><Link href="/specialist-partners" className="btn-accent inline-block mt-4">Specialist Partners</Link></div></div>;
  }

  return (
    <main className="profile-detail">
      <article className="profile-detail-card">
        <header className="profile-detail-header">
          <BackButton />

          <h1>{specialist.name}</h1>
          <p className="profile-detail-role">{specialist.position}</p>
        </header>

        <div className="profile-detail-main">
          <div className="profile-detail-image">
            <img
              src={specialist.imageUrl || "/default-profile.svg"}
              alt={specialist.name}
              onError={(event) => { event.currentTarget.src = "/default-profile.svg"; }}/>

            <div>
              <dl className="profile-detail-contact">
                <div><dt>Email</dt><dd>{specialist.email}</dd></div>
                <div><dt>Phone</dt><dd>{specialist.phone}</dd></div>
                <div><dt>Location</dt><dd>{specialist.location}</dd></div>
              </dl>
            </div>
          </div>

          <div className="profile-detail-info">
            <section className="profile-detail-about" aria-labelledby="specialist-about">
              <h2 id="specialist-about">About</h2>
              <p>{specialist.about || "No additional information has been provided."}</p>
            </section>
          </div>
        </div>
      </article>
    </main>
  );
}