import Link from "next/link";
import { FiArrowUpRight, FiLock, FiFolder, FiFileText, FiSearch, FiUsers, FiBriefcase, FiHeart } from "react-icons/fi";
import { getCurrentUser } from "@/app/lib/current-user";
import ScrollRevealSection from "@/app/components/scroll-reveal-section";

export default async function Home() {
  const { isAuthorized, isPhysicianSpecialist } = await getCurrentUser();
  const canViewGuides = isAuthorized || isPhysicianSpecialist;

  return (
    <div className="home-page w-full">
      <section className="home-hero">
        <div className="home-hero-content">
          <h1>A Clearer Way to <em>Coordinate Care.</em></h1>
          <p>
            Medicuro's Internal Resource Manual is a private clinic reference for the people and partners who help Medicuro deliver accessible, patient-centered care.
          </p>
          {canViewGuides && (
          <div className="home-hero-actions">
            <>
              <Link href="/physician-partners" className="btn-accent">
                View physicians <FiArrowUpRight aria-hidden="true" />
              </Link>
              <Link href="/staff-profiles" className="home-text-link">
                View staff <FiArrowUpRight aria-hidden="true" />
              </Link>
            </>
        </div>
        )}
        </div>
      </section>

      <section className="privacy-panel" aria-labelledby="privacy-title">
        <ScrollRevealSection className="privacy-icon"><FiLock aria-hidden="true" /></ScrollRevealSection>
        <ScrollRevealSection className="privacy-panel-content">
          <div>
            <h2 id="privacy-title">Keeping Information Private.</h2>
            <p>
              <b>Any information put in the Internal Resource Manual</b> is to remain private and is for clinic use only. Please treat existing records and anything added in the future as confidential.
            </p>
          </div>
        </ScrollRevealSection>
      </section>

      <ScrollRevealSection className="home-context" aria-labelledby="context-title">
        <div className="home-context-intro">
          <h2 id="context-title">The Right Guidance, Simplified.</h2>
          <p>
            Keep essential care documents together in a clear, easily searchable library, so your team can spend less time looking for information and more time moving care forward.
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
            <h3>Folders that Make Sense</h3>
            <p>Group items by topic or workflow, keeping related resources together and easier to navigate.</p>
          </article>
          <article>
            <span className="home-context-icon"><FiSearch aria-hidden="true" /></span>
            <h3>Easy to Find and Use</h3>
            <p>Search the library, view a video, preview a document, or download a PDF when needed.</p>
          </article>
          <article>
            <span className="home-context-icon"><FiFileText aria-hidden="true" /></span>
            <h3>Shared with the Right People</h3>
            <p>Make selected folders available to physician partners while keeping other internal resources private.</p>
          </article>
        </div>
      </ScrollRevealSection>

      <ScrollRevealSection className="home-profile-panel" aria-labelledby="profiles-title">
        <div className="home-profile-intro">
          <h2 id="profiles-title">Staff and Partners Behind the Care.</h2>
          <p>
            Find the staff and care partners who support your patients, with the roles and clinical focus that help your team connect with the right person quickly.
          </p>
        </div>

        <div className="home-profile-grid">
          <article>
            <span className="home-profile-icon"><FiUsers aria-hidden="true" /></span>
            <h3>Medicuro Staff Profiles</h3>
            <p>View team roles and the people available to support clinic operations, patient care, and day-to-day questions.</p>
            {canViewGuides && (
              <Link href="/staff-profiles" className="home-profile-link">
                View staff <FiArrowUpRight aria-hidden="true" />
              </Link>
            )}
          </article>
          <article>
            <span className="home-profile-icon"><FiBriefcase aria-hidden="true" /></span>
            <h3>Physician Partners</h3>
            <p>Keep physician information, specialties, and clinic contacts together for straightforward referrals and follow-up.</p>
            {canViewGuides && (
              <Link href="/physician-partners" className="home-profile-link">
                View physicians <FiArrowUpRight aria-hidden="true" />
              </Link>
            )}
          </article>
          <article>
            <span className="home-profile-icon"><FiHeart aria-hidden="true" /></span>
            <h3>Specialist Partners</h3>
            <p>Find specialist areas of practice and shared care information to help patients reach the right next step.</p>
            {canViewGuides && (
              <Link href="/specialist-partners" className="home-profile-link">
                View specialists <FiArrowUpRight aria-hidden="true" />
              </Link>
            )}
          </article>
        </div>
      </ScrollRevealSection>
    </div>
  );
}