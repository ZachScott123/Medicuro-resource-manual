"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BackButton from '@/app/lib/back-button';

export default function StaffPage() {
  let staffImage = "/default-profile.svg";

  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/staff")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load staff profile.");
        return response.json();
      })
      .then((records) => setEmployee(records.find((item) => item.id === id)))
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <span/>;
  }

  if (hasError) {
    return (
      <div className="manager-login-action" role="alert">
        <button className="btn-accent-continue" onClick={() => router.push("/login")} type="button">
          Please Login to Continue
        </button>
      </div>
    );
  }

  if (employee?.imageUrl) {
    staffImage = employee.imageUrl;
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-8 text-center">
          <p className="text-lg font-semibold">Employee not found.</p>
          <Link href="/staff-profiles" className="btn-accent inline-block mt-4">
            Return
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="profile-detail">
      <article className="profile-detail-card">
        <header className="profile-detail-header">
          <BackButton />
          
          <h1>{employee.name}</h1>
          <p className="profile-detail-role">{employee.position}</p>
        </header>

        <div className="profile-detail-main">
          <div className="profile-detail-image">
            <img
              src={staffImage}
              alt={employee.name}
              onError={(event) => { event.currentTarget.src = "/default-profile.svg"; }}/>

            <div>
              <dl className="profile-detail-contact">
                <div><dt>Email</dt><dd>{employee.email}</dd></div>
                <div><dt>Phone</dt><dd>{employee.phone}</dd></div>
                <div><dt>Location</dt><dd>{employee.location}</dd></div>
              </dl>
            </div>
            
          </div>

          <div className="profile-detail-info">
            <section className="profile-detail-about" aria-labelledby="staff-about">
              <h2 id="staff-about">About</h2>
              <p>{employee.about || "No additional information has been provided."}</p>
            </section>
          </div>
        </div>
      </article>
    </main>

  );
}