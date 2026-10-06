"use client";

import { useEffect, useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";

const accessGroups = [
  {
    key: "staff",
    title: "Authenticated staff",
    description: "Staff members allowed to access internal resources."
  },
  {
    key: "partners",
    title: "Authenticated partners",
    description: "Physician and specialist partners allowed to sign in."
  }
];

const emptyLists = {
  staff: [],
  partners: [],
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UserAccessLists() {
  const [emailLists, setEmailLists] = useState(emptyLists);
  const [emailInputs, setEmailInputs] = useState({ staff: "", partners: "", administrators: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [savingList, setSavingList] = useState("");
  const [error, setError] = useState("");
  const [savedList, setSavedList] = useState("");

  useEffect(() => {
    async function loadLists() {
      try {
        const response = await fetch("/api/admin/access-lists", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Unable to load access lists.");
        }

        setEmailLists({
          staff: result.staff || [],
          partners: result.partners || [],
        });

      } catch (loadError) {
        setLoadFailed(true);
        setError(loadError.message || "Unable to load access lists.");
      } finally {
        setIsLoading(false);
      }
    }

    loadLists();
  }, []);

  function addEmail(list) {
    const email = emailInputs[list].trim().toLowerCase();
    setError("");
    setSavedList("");

    if (!emailPattern.test(email)) {
      setError("Enter a valid email address before adding it.");
      return;
    }
    if (emailLists[list].includes(email)) {
      setError("That email address is already in this list.");
      return;
    }

    setEmailLists((current) => ({ ...current, [list]: [...current[list], email] }));
    setEmailInputs((current) => ({ ...current, [list]: "" }));
  }

  function removeEmail(list, email) {
    setError("");
    setSavedList("");
    setEmailLists((current) => ({ ...current, [list]: current[list].filter((entry) => entry !== email)}));
  }

  async function saveList(list) {
    setSavingList(list);
    setError("");
    setSavedList("");

    try {
      const response = await fetch("/api/admin/access-lists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list, emails: emailLists[list] })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to save this access list.");
      }

      setEmailLists((current) => ({ ...current, [list]: result.emails }));
      setSavedList(list);
    } catch (saveError) {
      setError(saveError.message || "Unable to save this access list.");
    } finally {
      setSavingList("");
    }
  }

  return (
    <section className="admin-access" aria-labelledby="admin-access-title">
      <header className="admin-access-heading">
        <div>
          <h2 id="admin-access-title">Manage User Access</h2>
          <p>Add or remove the user email addresses allowed into each part of the site.</p>
        </div>
      </header>

      {error && <p className="admin-access-status is-error" role="alert">{error}</p>}
      
      {isLoading ? (
        <p className="admin-access-status" role="status">Loading access lists...</p>
      ) : loadFailed ? (
        <p className="admin-access-status" role="status">Access lists are unavailable. Reload the page to try again.</p>
      ) : (
        <div className="admin-access-groups">
          {accessGroups.map(({ key, title, description }) => (
            <section className="admin-access-group" key={key} aria-labelledby={`access-${key}-title`}>
              <header>
                <h3 id={`access-${key}-title`}>{title}</h3>
                <p>{description}</p>
              </header>
              <div className="admin-email-chips" aria-label={`${title} email addresses`}>
                {emailLists[key].map((email) => (
                  <span className="admin-email-chip" key={email}>
                    <span>{email}</span>
                    <button type="button" aria-label={`Remove ${email}`} disabled={Boolean(savingList)} onClick={() => removeEmail(key, email)}>
                      <FiX aria-hidden="true" />
                    </button>
                  </span>
                ))}
                {emailLists[key].length === 0 && (
                  <span className="admin-email-empty">No email addresses added.</span>
                )}
              </div>
              <form className="admin-access-add" onSubmit={(event) => { event.preventDefault(); addEmail(key); }}>
                <label className="sr-only" htmlFor={`access-${key}-email`}>Add an email address to {title}</label>
                <input
                  id={`access-${key}-email`}
                  type="email"
                  disabled={Boolean(savingList)}
                  value={emailInputs[key]}
                  placeholder="name@example.com"
                  onChange={(event) => setEmailInputs((current) => ({ ...current, [key]: event.target.value }))}/>
                
                <button type="submit" aria-label={`Add email to ${title}`} disabled={Boolean(savingList)}>
                  <FiPlus aria-hidden="true" />
                  Add
                </button>
              </form>
              <footer className="admin-access-footer">
                
                {savedList === key && <span role="status">Changes saved.</span>}
                <button
                  className="btn-accent"
                  type="button"
                  disabled={Boolean(savingList)}
                  onClick={() => saveList(key)}>
                  {savingList === key ? "Saving..." : "Save changes"}
                </button>
              </footer>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}