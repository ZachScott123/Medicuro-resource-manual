import Link from "next/link";
import { FiArrowUpRight, FiLock, FiFolder, FiFileText, FiSearch } from "react-icons/fi";
import { getCurrentUser } from "@/app/lib/current-user";

export default async function Home() {
  const { isAuthorized, isPhysicianSpecialist } = await getCurrentUser();
  const canViewGuides = isAuthorized || isPhysicianSpecialist;

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
            <Link href="/staff-profiles" className="home-text-link">
              View Staff <FiArrowUpRight aria-hidden="true" />
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
          <div className="eyebrow">Medicuro resource library</div>
          <h2 id="context-title">The right guidance, right when it’s needed.</h2>
          <p>
            Keep essential care documents together in a clear, searchable library, so your team can spend less time looking for information and more time moving care forward.
          </p>
          {canViewGuides && (
            <Link href="/medicuro-guides" className="home-context-link">
              Explore the guide library <FiArrowUpRight aria-hidden="true" />
            </Link>
          )}
        </div>

        <div className="home-context-notes">
          <article>
            <span className="home-context-icon"><FiFolder aria-hidden="true" /></span>
            <span className="home-context-number">01 / ORGANIZED</span>
            <h3>Folders that make sense</h3>
            <p>Group guides by topic or workflow, keeping related resources together and easier to navigate.</p>
          </article>
          <article>
            <span className="home-context-icon"><FiSearch aria-hidden="true" /></span>
            <span className="home-context-number">02 / FINDABLE</span>
            <h3>Easy to find and use</h3>
            <p>Search the library, preview a document, or download a PDF when you need it.</p>
          </article>
          <article>
            <span className="home-context-icon"><FiFileText aria-hidden="true" /></span>
            <span className="home-context-number">03 / THOUGHTFULLY SHARED</span>
            <h3>Shared with the right people</h3>
            <p>Make selected folders available to physician partners while keeping other internal resources private.</p>
          </article>
        </div>
      </section>
    </div>
  );
}