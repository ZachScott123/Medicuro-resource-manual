import Link from "next/link";
import { FiArrowUpRight, FiLock } from "react-icons/fi";
import { getCurrentUser } from "@/app/lib/current-user";

export default async function Home() {
  const { authenticated, isAuthorized } = await getCurrentUser();
  const canViewGuides = !authenticated || isAuthorized;

  return (
    <div className="home-page w-full">
      <section className="home-hero">
        <div className="home-hero-content">
          <h1>A Clearer Way to <em>Coordinate Care</em></h1>
          <p>
            Medicuro's Internal Resource Manual is a private clinic reference for the people and partners who help Medicuro deliver accessible, patient-centered care.
          </p>
          <div className="home-hero-actions">
            <Link href="/physician-partners" className="btn-accent">
              View physicians <FiArrowUpRight aria-hidden="true" />
            </Link>
            {canViewGuides && (
            <Link href="/medicuro-guides" className="home-text-link">
              View guides <FiArrowUpRight aria-hidden="true" />
            </Link>
            )}
        </div>
        </div>
      </section>

      <section className="privacy-panel" aria-labelledby="privacy-title">
        <div className="privacy-icon"><FiLock aria-hidden="true" /></div>
        <div>
          <div className="eyebrow">A note on privacy</div>
          <h2 id="privacy-title">Keep provider information private.</h2>
          <p>
            Any information put in the internal resource manual is to remain private and is for clinic use only. Please treat existing records and anything added in the future as confidential.
          </p>
        </div>
      </section>

      <section className="home-context" aria-labelledby="context-title">
        <div className="home-context-intro">
          <div className="eyebrow">A working reference</div>
          <h2 id="context-title">The details that keep care moving.</h2>
          <p>
            The people, contacts, and procedures around a clinic change often. This manual keeps those details together so the next step is easier to find and the right person is easier to reach.
          </p>
    </div>

        <div className="home-context-notes">
          <article>
            <span className="home-context-number">01</span>
            <h3>People and partners</h3>
            <p>Find the teams, physicians, specialists, and external partners who support Medicuro's day-to-day work.</p>
          </article>
          <article>
            <span className="home-context-number">02</span>
            <h3>Practical guidance</h3>
            <p>Use the guide library for the documents and instructions that help turn a question into a clear next action.</p>
          </article>
          <article>
            <span className="home-context-number">03</span>
            <h3>Current information</h3>
            <p>Check the record before reaching out, and update the source when a contact, role, or process changes.</p>
          </article>
        </div>
      </section>
    </div>
  );
}