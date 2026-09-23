"use client";

import { useEffect, useState } from "react";
import { FiDownload, FiExternalLink, FiFileText, FiSave, FiTrash2, FiUpload, FiX, FiLock } from "react-icons/fi";
import { useRouter } from "next/navigation";

const emptyGuide = {
  title: "",
  description: "",
  fileName: "",
  fileData: ""
};

export default function GuideManager({ initialGuides = [] }) {
  const [guides, setGuides] = useState(initialGuides);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(emptyGuide);
  const [touchedFields, setTouchedFields] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/guides")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load guides.");
        return response.json();
      })
      .then((records) => {
        setGuides(records);
        setIsLoading(false);
      })
      .catch(() => {
        setError("Access denied. Please login with an authorized account to access Guides and Documents.");
        setIsLoading(false);
      });
  }, [initialGuides]);

  function openForm() {
    setFormData(emptyGuide);
    setTouchedFields({});
    setError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setFormData(emptyGuide);
    setTouchedFields({});
    setError("");
    setIsFormOpen(false);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function markFieldAsTouched(event) {
    const { name } = event.target;
    setTouchedFields((current) => ({ ...current, [name]: true }));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    setTouchedFields((current) => ({ ...current, fileData: true }));
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please choose a PDF file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((current) => ({
        ...current,
        fileName: file.name,
        fileData: reader.result
      }));
    };
    reader.readAsDataURL(file);
  }

  async function saveGuide(event) {
    event.preventDefault();

    const invalidFields = [
      !formData.title.trim() && "title",
      !formData.fileData && "fileData"
    ].filter(Boolean);
    if (invalidFields.length > 0) {
      setTouchedFields((current) => ({
        ...current,
        ...Object.fromEntries(invalidFields.map((field) => [field, true]))
      }));
      document.querySelector(`[name="${invalidFields[0] === "fileData" ? "guide-file" : invalidFields[0]}"]`)?.focus();
      return;
    }

    setIsSaving(true);
    setError("");

    const guide = {
      title: formData.title.trim(),
      description: formData.description.trim() || "...",
      fileName: formData.fileName,
      fileData: formData.fileData
    };

    const response = await fetch("/api/guides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guide)
    });

    if (!response.ok) {
      setError("Unable to save guide. Please choose a PDF and try again.");
      setIsSaving(false);
      return;
    }

    const savedGuide = await response.json();
    setGuides((current) => [savedGuide, ...current]);
    setIsSaving(false);
    closeForm();
  }

  function requestDelete(guide) {
    setDeleteTarget(guide);
  }

  async function deleteGuide() {
    if (!deleteTarget) return;

    const response = await fetch("/api/guides", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id })
    });

    if (!response.ok) {
      setError("Unable to delete guide. Please try again.");
      return;
    }

    setGuides((current) => current.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <section className="guide-library" aria-labelledby="guide-library-title">

      {error && (
        <div className="manager-login-action" role="alert">
          <button className="btn-accent-continue inline-flex items-center gap-2" onClick={() => router.push("/login")} type="button">
            <FiLock aria-hidden="true" />
            <span>Please Login to Continue</span>
          </button>
        </div>
			)}

      {isLoading ? (
        <span/>
      ) : guides.length > 0 ? (
        <span>
          <div className="directory-toolbar guide-toolbar">
            <div>
              <div className="eyebrow">Reference library</div>
              <h2 id="guide-library-title">Guides and Documents</h2>
            </div>
            <button type="button" onClick={openForm} className="btn-accent inline-flex items-center gap-2" aria-label="Upload a PDF guide" title="Upload a PDF guide">
              <FiUpload aria-hidden="true" />
              <span>Upload PDF</span>
            </button>
          </div>

          <div className="guide-grid">
            {guides.map((guide) => (
              <article className="guide-card" key={guide.id}>
                <div className="guide-card-icon"><FiFileText aria-hidden="true" /></div>
                <div className="guide-card-copy">
                  <h3>{guide.title}</h3>
                  <p>{guide.description}</p>
                  <small>{guide.fileName}</small>
                </div>
                <div className="guide-card-actions">
                  <a href={guide.fileData} target="_blank" rel="noopener noreferrer" className="btn-accent2" aria-label={`Open ${guide.title}`} title={`Open ${guide.title}`}>
                    <FiExternalLink aria-hidden="true" />
                  </a>
                  <a href={guide.fileData} download={guide.fileName} className="btn-accent2" aria-label={`Download ${guide.title}`} title={`Download ${guide.title}`}>
                    <FiDownload aria-hidden="true" />
                  </a>
                  <button type="button" onClick={() => requestDelete(guide)} className="guide-delete-button" aria-label={`Delete ${guide.title}`} title={`Delete ${guide.title}`}>
                    <FiTrash2 aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </span>
      ) : (
        !error &&
        <div className="guide-empty-state">
          <FiFileText aria-hidden="true" />
          <p>No guides have been uploaded yet.</p>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="guide-form-title">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 text-[#123243] shadow-2xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 id="guide-form-title" className="text-2xl font-bold">Upload PDF guide</h2>
              <button type="button" onClick={closeForm} className="p-2 text-[#607984] hover:text-[#123243]" aria-label="Close form">
                <FiX size={22} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={saveGuide} noValidate className="grid gap-4">
              <label className="flex flex-col gap-1">
                <span>
                  Title
                  {touchedFields.title && !formData.title.trim() && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
                </span>
                <input
                  required
                  name="title"
                  maxLength={200}
                  value={formData.title}
                  onChange={updateField}
                  onBlur={markFieldAsTouched}
                  placeholder="Guide title"
                  aria-invalid={touchedFields.title && !formData.title.trim()}
                  aria-describedby={touchedFields.title && !formData.title.trim() ? "title-error" : undefined}
                  className={`rounded-md border-[1.5px] p-2 text-neutral-900 ${touchedFields.title && !formData.title.trim() ? "border-red-500" : "border-teal-400"}`}
                />
                {touchedFields.title && !formData.title.trim() && <span id="title-error" className="text-sm text-red-600">This field is required.</span>}
              </label>
              <label className="flex flex-col gap-1">Description
                <textarea maxLength={1400} name="description" value={formData.description} onChange={updateField} placeholder="What is this guide for?" rows={3} className="rounded-md border-[1.5px] border-teal-400 p-2 text-neutral-900" />
              </label>
              <label className="flex flex-col gap-1">
                <span>
                  PDF file
                  {touchedFields.fileData && !formData.fileData && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
                </span>
                <input
                  required
                  name="fileData"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  onBlur={markFieldAsTouched}
                  aria-invalid={touchedFields.fileData && !formData.fileData}
                  aria-describedby={touchedFields.fileData && !formData.fileData ? "file-error" : undefined}
                  className={`rounded-md border p-2 text-neutral-900 ${touchedFields.fileData && !formData.fileData ? "border-red-500" : "border-[#d8e8e8]"}`}
                />
                {touchedFields.fileData && !formData.fileData && <span id="file-error" className="text-sm text-red-600">A PDF file is required.</span>}
              </label>
              {formData.fileName && <p className="text-sm text-[#607984]">Selected: {formData.fileName}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeForm} className="rounded-md border border-[#d8e8e8] px-4 py-2">Cancel</button>
                <button type="submit" disabled={isSaving || !formData.fileData} className="btn-accent inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <FiSave aria-hidden="true" />
                  {isSaving ? "Saving..." : "Save guide"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-guide-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-[#123243] shadow-2xl">
            <h2 id="delete-guide-title" className="text-xl font-bold">Delete {deleteTarget.title}?</h2>
            <p className="mt-2 text-sm text-[#607984]">This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-full border border-[#d8e8e8] px-4 py-2 text-sm font-bold text-[#176183]">Cancel</button>
              <button type="button" onClick={deleteGuide} className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
