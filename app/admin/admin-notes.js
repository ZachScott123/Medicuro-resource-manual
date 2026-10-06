"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiArrowRight, FiX } from "react-icons/fi";
import AdminAccessLists from "./access-list-admins";
import UserAccessLists from "./access-list-users";

export default function AdminNotes() {
  const [openMenu, setOpenMenu] = useState("");

  useEffect(() => {
    if (!openMenu) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpenMenu("");
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openMenu]);

  return (
    <>
      <div className="admin-notes">
        <article>
          <div className="admin-note-stat">
            <strong className="admin-note-count">8</strong>
            <button
              className="admin-notes-btn"
              type="button"
              aria-label="Staff members"
              aria-haspopup="dialog"
              aria-expanded={openMenu === "staff"}
              aria-controls="admin-staff-menu"
              onClick={() => setOpenMenu("staff")}>

              <FiArrowRight aria-hidden="true" />
            </button>
          </div>
          <p>Manage Authenticated Staff Members</p>
          <small>Team and staff member accounts.</small>
        </article>
        <article>
          <div className="admin-note-stat">
            <strong className="admin-note-count">5</strong>
            <button
              className="admin-notes-btn"
              type="button"
              aria-label="Authenticated partners"
              aria-haspopup="dialog"
              aria-expanded={openMenu === "partners"}
              aria-controls="admin-partners-menu"
              onClick={() => setOpenMenu("partners")}>

              <FiArrowRight aria-hidden="true" />
            </button>
          </div>
          <p>Manage Authenticated Partners</p>
          <small>Physician and specialist partner accounts.</small>
        </article>
        <article>
          <div className="admin-note-stat">
            <strong className="admin-note-count">13</strong>
            <button
              className="admin-notes-btn"
              type="button"
              aria-label="User accounts"
              aria-haspopup="dialog"
              aria-expanded={openMenu === "accounts"}
              aria-controls="admin-accounts-menu"
              onClick={() => setOpenMenu("accounts")}>

              <FiArrowRight aria-hidden="true" />
            </button>
          </div>
          <p>Manage User Accounts</p>
          <small>Accounts with access to internal resources.</small>
        </article>
        <article>
          <div className="admin-note-stat">
            <strong className="admin-note-count">2</strong>
            <button
              className="admin-notes-btn"
              type="button"
              aria-label="Administrative users"
              aria-haspopup="dialog"
              aria-expanded={openMenu === "administrators"}
              aria-controls="admin-administrators-menu"
              onClick={() => setOpenMenu("administrators")}>

              <FiArrowRight aria-hidden="true" />
            </button>
          </div>
          <p>Manage Administrative Users</p>
          <small>Users who maintain workspace content.</small>
        </article>
      </div>

      {openMenu && (
        <div className="admin-menu-layer">
          <button
            className="admin-menu-backdrop"
            type="button"
            aria-label="Close admin menu"
            onClick={() => setOpenMenu("")}/>

          <aside
            className="admin-menu-panel"
            id={`admin-${openMenu}-menu`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`admin-${openMenu}-title`}>
            
            {openMenu === "staff" && (
              <>
                <div className="admin-menu-heading">
                  <img src="/medicuro-logo-ink.png" alt="Medicuro" className="admin-menu-logo"/>
                  <h2 id="admin-staff-title">Staff Members</h2>
                  <button
                    className="admin-menu-close"
                    type="button"
                    aria-label="Close staff menu"
                    onClick={() => setOpenMenu("")}
                  >
                    <FiX aria-hidden="true" />
                  </button>
                </div>
                <nav className="admin-menu-links" aria-label="Staff actions">
                  <Link className="admin-menu-link" href="/staff-profiles" onClick={() => setOpenMenu("")}>
                    <span>Manage staff profiles</span>
                    <FiArrowRight aria-hidden="true" />
                  </Link>
                </nav>
              </>
            )}

            {openMenu === "partners" && (
              <>
                <div className="admin-menu-heading">
                  <img src="/medicuro-logo-ink.png" alt="Medicuro" className="admin-menu-logo"/>
                  <h2 id="admin-partners-title">Authenticated Partners</h2>
                  <button
                    className="admin-menu-close"
                    type="button"
                    aria-label="Close partners menu"
                    onClick={() => setOpenMenu("")}
                  >
                    <FiX aria-hidden="true" />
                  </button>
                </div>
                <nav className="admin-menu-links" aria-label="Partner actions">
                  <Link className="admin-menu-link" href="/physician-partners" onClick={() => setOpenMenu("")}>
                    <span>Manage physician partners</span>
                    <FiArrowRight aria-hidden="true" />
                  </Link>
                  <Link className="admin-menu-link" href="/specialist-partners" onClick={() => setOpenMenu("")}>
                    <span>Manage specialist partners</span>
                    <FiArrowRight aria-hidden="true" />
                  </Link>
                </nav>
              </>
            )}

            {openMenu === "accounts" && (
              <>
                <div className="admin-menu-heading">
                  <img src="/medicuro-logo-ink.png" alt="Medicuro" className="admin-menu-logo"/>
                  <h2 id="admin-accounts-title">User Accounts</h2>
                  <button
                    className="admin-menu-close"
                    type="button"
                    aria-label="Close user accounts menu"
                    onClick={() => setOpenMenu("")}>

                    <FiX aria-hidden="true" />
                  </button>
                </div>
                <UserAccessLists />
              </>
            )}

            {openMenu === "administrators" && (
              <>
                <div className="admin-menu-heading">
                  <img src="/medicuro-logo-ink.png" alt="Medicuro" className="admin-menu-logo"/>
                  <h2 id="admin-administrators-title">Administrative Users</h2>
                  <button
                    className="admin-menu-close"
                    type="button"
                    aria-label="Close administrative users menu"
                    onClick={() => setOpenMenu("")}>
                      
                    <FiX aria-hidden="true" />
                  </button>
                </div>
                <AdminAccessLists />
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
