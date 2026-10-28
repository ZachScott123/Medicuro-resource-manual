"use client";

import { useEffect, useState } from "react";
import { FiAlertCircle, FiDownload, FiBookOpen, FiEdit, FiExternalLink, FiFileText, FiTv, FiFolder, FiPlay, FiPlus, FiSave, FiSearch, FiTrash2, FiUpload, FiX } from "react-icons/fi";

//canManage = editors, canUpload = staff.

//fix guide upload for staff - no perms

const emptyGuide = {
  title: "",
  description: "",
  folder: "Uncategorized",
  partnerViewable: false,
  type: "file",
  fileName: "",
  fileData: "",
  videoUrl: "",
  checklistEnabled: false,
  checklist: []
};

const allFolders = "all";
const newFolderOption = "__new_folder__";

function getYouTubeVideoId(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (hostname === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || "";
    }
    if (!["youtube.com", "www.youtube.com", "m.youtube.com"].includes(hostname)) return "";
    if (url.pathname === "/watch") return url.searchParams.get("v") || "";
    return url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})(?:\/|$)/)?.[1] || "";
  } catch {
    return "";
  }
}

export default function GuideManager({ initialGuides = [], canManage = true, canUpload = canManage }) {
  const [guides, setGuides] = useState(initialGuides);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(allFolders);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const [formData, setFormData] = useState(emptyGuide);
  const [checklistItem, setChecklistItem] = useState("");
  const [checkedChecklistItems, setCheckedChecklistItems] = useState([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [touchedFields, setTouchedFields] = useState({});
  const [error, setError] = useState("");
  const [folderPermissionError, setFolderPermissionError] = useState("");
  const [isSavingFolderPermission, setIsSavingFolderPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedGuide, setSelectedGuide] = useState(null);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setLoadError("");

    fetch("/api/guides")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load guides.");
        return response.json();
      })
      .then((records) => {
        if (!isActive) return;
        setGuides(records);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isActive) return;
        setLoadError("We couldn’t load guides right now. Check your connection and try again.");
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
    }, [initialGuides, loadAttempt]);

  useEffect(() => {
      if (!selectedGuide) return undefined;

      function closeOnEscape(event) {
        if (event.key === "Escape") closeGuidePreview();
      }

      window.addEventListener("keydown", closeOnEscape);
      return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedGuide]);

  const folders = [...new Set(guides.map((guide) => guide.folder || "Uncategorized"))]
    .sort((first, second) => first.localeCompare(second));
  if (folders.length === 0) folders.push("Uncategorized");
  const populatedFolders = folders.filter((folder) =>
    guides.some((guide) => (guide.folder || "Uncategorized") === folder)
  );
  const query = searchQuery.trim().toLowerCase();
  const filteredGuides = guides.filter((guide) => {
    const matchesFolder = selectedFolder === allFolders || (guide.folder || "Uncategorized") === selectedFolder;
    const matchesQuery = !query || [guide.title, guide.description, guide.fileName, guide.folder]
      .some((field) => field?.toLowerCase().includes(query));
    return matchesFolder && matchesQuery;
  });

  function isFolderPartnerViewable(folder) {
    const folderGuides = guides.filter((guide) => (guide.folder || "Uncategorized") === folder);
    return folderGuides.length > 0 && folderGuides.every((guide) => guide.partnerViewable === true);
  }

  const selectedFolderPartnerViewable = selectedFolder !== allFolders && isFolderPartnerViewable(selectedFolder);

  function openForm() {
    const folder = folders[0] || "Uncategorized";
    setEditingGuide(null);
    setFormData({
      ...emptyGuide,
      folder,
      partnerViewable: isFolderPartnerViewable(folder)
    });
    setIsCreatingFolder(false);
    setNewFolderName("");
    setTouchedFields({});
    setChecklistItem("");
    setError("");
    setIsFormOpen(true);
  }

  function openEditForm(guide) {
    setEditingGuide(guide);
    setFormData({
      ...emptyGuide,
      title: guide.title,
      description: guide.description,
      folder: guide.folder || "Uncategorized",
      partnerViewable: guide.partnerViewable === true,
      type: guide.type,
      fileName: guide.fileName || "",
      videoUrl: guide.type === "video" ? `https://youtu.be/${guide.videoId}` : "",
      checklistEnabled: guide.checklist?.length > 0,
      checklist: guide.checklist || []
    });

    setIsCreatingFolder(false);
    setNewFolderName("");
    setTouchedFields({});
    setChecklistItem("");
    setError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingGuide(null);
    setFormData(emptyGuide);
    setIsCreatingFolder(false);
    setNewFolderName("");
    setTouchedFields({});
    setChecklistItem("");
    setError("");
    setIsFormOpen(false);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function addChecklistItem() {
    const item = checklistItem.trim();
    if (!item || formData.checklist.length >= 50) return;

    setFormData((current) => ({ ...current, checklist: [...current.checklist, item] }));
    setChecklistItem("");
  }

  function removeChecklistItem(index) {
    setFormData((current) => ({
      ...current,
      checklist: current.checklist.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function openGuidePreview(guide) {
    setSelectedGuide(guide);
    setCheckedChecklistItems([]);
  }

  function closeGuidePreview() {
    setSelectedGuide(null);
    setCheckedChecklistItems([]);
  }

  function updateGuideType(event) {
    setFormData((current) => ({
      ...current,
      type: event.target.value,
      fileName: "",
      fileData: "",
      videoUrl: ""
    }));
    setTouchedFields({});
    setError("");
  }

  function updateFolderChoice(event) {
    if (event.target.value === newFolderOption) {
      setIsCreatingFolder(true);
      setNewFolderName("");
      setFormData((current) => ({ ...current, partnerViewable: false }));
      setTouchedFields((current) => ({ ...current, folder: false }));
      return;
    }

    setIsCreatingFolder(false);
    const folder = event.target.value;
    setFormData((current) => ({
      ...current,
      folder,
      partnerViewable: isFolderPartnerViewable(folder)
    }));
  }

  function updateNewFolderName(event) {
    const folder = event.target.value;
    const existingFolder = folders.find((item) => item.toLowerCase() === folder.trim().toLowerCase());
    setNewFolderName(folder);
    setFormData((current) => ({
      ...current,
      partnerViewable: existingFolder
        ? isFolderPartnerViewable(existingFolder)
        : false
    }));
  }

  async function updateFolderPartnerViewable(event) {
    const partnerViewable = event.target.checked;
    setIsSavingFolderPermission(true);
    setFolderPermissionError("");

    try {
      const response = await fetch("/api/guides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: selectedFolder, partnerViewable })
      });

      if (!response.ok) {
        setFolderPermissionError("Unable to update folder partner access. Please try again.");
        return;
      }

      setGuides((current) => current.map((guide) =>
        (guide.folder || "Uncategorized") === selectedFolder
          ? { ...guide, partnerViewable }
          : guide
      ));
    } catch {
      setFolderPermissionError("Unable to update folder partner access. Please try again.");
    } finally {
      setIsSavingFolderPermission(false);
    }
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
      setFormData((current) => ({ ...current, fileName: "", fileData: "" }));
      setError("Please choose a PDF file.");
      return;
    }

    setError("");
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
      formData.type === "file" && !formData.fileData && !(editingGuide?.type === "file" && formData.fileName) && "fileData",
      formData.type === "video" && !getYouTubeVideoId(formData.videoUrl) && "videoUrl",
      isCreatingFolder && !newFolderName.trim() && "folder"
    ].filter(Boolean);
    if (invalidFields.length > 0) {
      setTouchedFields((current) => ({
        ...current,
        ...Object.fromEntries(invalidFields.map((field) => [field, true]))
      }));
      document.querySelector(`[name="${invalidFields[0]}"]`)?.focus();
      return;
    }

    setIsSaving(true);
    setError("");

    const guide = {
      title: formData.title.trim(),
      description: formData.description.trim() || "...",
      folder: isCreatingFolder
        ? folders.find((folder) => folder.toLowerCase() === newFolderName.trim().toLowerCase()) || newFolderName.trim()
        : formData.folder,
      partnerViewable: formData.partnerViewable,
      type: formData.type,
      checklist: formData.checklistEnabled ? formData.checklist : [],
      ...(formData.type === "video"
        ? {
          videoId: getYouTubeVideoId(formData.videoUrl)
        }
        : formData.fileData
          ? {
              fileName: formData.fileName,
              fileData: formData.fileData
          }
          : {})
    };

    const response = await fetch("/api/guides", {
      method: editingGuide ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingGuide ? { ...guide, id: editingGuide.id } : guide)
    });

    if (!response.ok) {
      setError(formData.type === "video"
        ? "Unable to save guide. Please check the YouTube URL."
        : "Unable to save guide. Please choose a PDF and try again.");
      setIsSaving(false);
      return;
    }

    const savedGuide = await response.json();
    setGuides((current) => {
      const updatedGuides = current.map((item) => {
        if (item.id === savedGuide.id) return savedGuide;
        return (item.folder || "Uncategorized") === savedGuide.folder
          ? { ...item, partnerViewable: savedGuide.partnerViewable }
          : item;
      });
      
      return editingGuide ? updatedGuides : [savedGuide, ...updatedGuides];
    });
    setSelectedFolder(savedGuide.folder);
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

    const remainingGuides = guides.filter((item) => item.id !== deleteTarget.id);
    setGuides(remainingGuides);
    if (
      selectedFolder !== allFolders &&
      !(remainingGuides.some((guide) => (guide.folder || "Uncategorized") === selectedFolder))
    ) {
      setSelectedFolder(allFolders);
    }
    setDeleteTarget(null);
  }

  return (
    <section className="guide-library" aria-label="Care delivery guides">

      {error && <div className="guide-alert" role="alert"><FiAlertCircle aria-hidden="true" />{error}</div>}

      {isLoading ? (
        <div className="guide-loading" role="status" aria-live="polite">
          <span className="guide-loading-mark" aria-hidden="true"><FiFileText /></span>
          <span>Loading your guides…</span>
        </div>
      ) : loadError ? (
        <div className="guide-empty-state guide-error-state" role="alert">
          <FiAlertCircle aria-hidden="true" />
          <h3>We couldn’t load the library</h3>
          <p>{loadError}</p>
          <button type="button" className="btn-accent" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="directory-toolbar guide-toolbar">
            <label className="guide-search">
              <FiSearch aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search guides and documents"
                aria-label="Search guides by name, description, or file"
              />
            </label>
            {canUpload && (
              <button type="button" onClick={openForm} className="btn-accent inline-flex items-center gap-2" aria-label="Upload a guide" title="Upload a guide">
                <FiUpload aria-hidden="true" />
                <span>Add a guide</span>
              </button>
            )}
          </div>

          <nav className="guide-folder-navigation" aria-label="Browse guides by folder">
            <span className="guide-folder-navigation-label">Browse folders</span>
            <div className="guide-folder-options">
              <button
                type="button"
                className="guide-folder-option"
                aria-pressed={selectedFolder === allFolders}
                onClick={() => setSelectedFolder(allFolders)}
              >
                All folders <span>{guides.length}</span>
              </button>
              {populatedFolders.map((folder) => {
                const folderCount = guides.filter((guide) => (guide.folder || "Uncategorized") === folder).length;
                return (
                  <button
                    type="button"
                    className="guide-folder-option"
                    aria-pressed={selectedFolder === folder}
                    key={folder}
                    onClick={() => setSelectedFolder(folder)}
                  >
                    {folder} <span>{folderCount}</span>
                  </button>
                );
              })}
            </div>
          </nav>
          {canUpload && selectedFolder !== allFolders && (
            <div className="guide-folder-permission guide-folder-access">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedFolderPartnerViewable}
                  onChange={updateFolderPartnerViewable}
                  disabled={isSavingFolderPermission}
                  className="h-4 w-4 accent-teal-700"
                />
                <span>Partners can view this folder</span>
              </label>
              {folderPermissionError && <p role="alert">{folderPermissionError}</p>}
            </div>
          )}

          <div className="guide-results-summary" aria-live="polite">
            <strong>{filteredGuides.length}</strong> {filteredGuides.length === 1 ? "guide" : "guides"}
            {(searchQuery || selectedFolder !== allFolders) && <span> matching your selection</span>}
          </div>

          {filteredGuides.length > 0 ? (
            <div className="guide-grid">
              {filteredGuides.map((guide) => (
                <article className="guide-card" key={guide.id}>
                  <div className="guide-card-heading">
                    {guide.type === "video" ? (
                      <div className="guide-card-icon-video" aria-hidden="true">
                        <FiTv aria-hidden="true" />
                      </div>
                    ) : (
                      <div className="guide-card-icon-file" aria-hidden="true">
                        <FiFileText aria-hidden="true" />
                      </div>
                    )}
                    <span className={`guide-type-badge${guide.type === "video" ? " guide-type-badge-video" : ""}`}>
                      {guide.type === "video" ? "Video" : "PDF guide"}
                    </span>
                  </div>
                  <div className="guide-card-copy">
                    <h3>{guide.title}</h3>
                    {guide.description && guide.description !== "..." && <p>{guide.description}</p>}
                  </div>
                  <small className="guide-card-folder"><FiFolder aria-hidden="true" /> {guide.folder || "Uncategorized"}</small>
                  {guide.type === "file" && guide.fileName && (
                    <small className="guide-card-filename" title={guide.fileName}>{guide.fileName}</small>
                  )}
                  <div className="guide-card-footer">
                    {guide.type === "video" ? (
                      <button
                        type="button"
                        onClick={() => openGuidePreview(guide)}
                        className="guide-open-button"
                        aria-label={`Watch ${guide.title}`}
                      >
                        <FiPlay aria-hidden="true" />
                        <span>Watch video</span>
                      </button>
                    ) : (
                      <button type="button" onClick={() => openGuidePreview(guide)} className="guide-open-button" aria-label={`Open ${guide.title}`}>
                        <FiBookOpen aria-hidden="true" />
                        <span>Open guide</span>
                      </button>
                    )}
                    {canManage && (
                      <div className="guide-card-actions" role="group" aria-label={`${guide.title} management actions`}>
                        <button type="button" onClick={() => openEditForm(guide)} className="guide-management-button" aria-label={`Edit ${guide.title}`} title={`Edit ${guide.title}`}>
                          <FiEdit aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => requestDelete(guide)} className="guide-management-button guide-management-delete" aria-label={`Delete ${guide.title}`} title={`Delete ${guide.title}`}>
                          <FiTrash2 aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : guides.length > 0 ? (
            <div className="guide-empty-state">
              <FiSearch aria-hidden="true" />
              <h3>No guides found</h3>
              <p>Try another search term or choose a different folder.</p>
              <button type="button" className="guide-clear-filters" onClick={() => {
                setSearchQuery("");
                setSelectedFolder(allFolders);
              }}>
                Clear search and folder
              </button>
            </div>
          ) : (
            <div className="guide-empty-state">
              <FiFileText aria-hidden="true" />
              <h3>{canUpload ? "Your guide library is ready" : "No guides are available yet"}</h3>
              <p>{canUpload
                ? "Add a PDF or video to make your team’s first resource easy to find."
                : "There are no guides shared with your account right now. Contact your clinic administrator if you need access."}</p>
              {canUpload && (
                <button type="button" onClick={openForm} className="btn-accent inline-flex items-center gap-2">
                  <FiUpload aria-hidden="true" />
                  <span>Add the first guide</span>
                </button>
              )}
            </div>
          )}
        </>
      )}

      {selectedGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-preview-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeGuidePreview();
          }}
        >
          <div className="guide-video-dialog">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id="guide-preview-title" className="text-xl font-bold">{selectedGuide.title}</h2>
              {selectedGuide.type === "file" && (
                <div className="guide-preview-toolbar-actions">
                  <a
                    href={`/api/guides/file/${encodeURIComponent(selectedGuide.id)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-accent2"
                    aria-label={`Open ${selectedGuide.title} PDF in a new tab`}
                    title="Open PDF in a new tab"
                  >
                    <FiExternalLink aria-hidden="true" />
                  </a>
                  <a
                    href={`/api/guides/file/${encodeURIComponent(selectedGuide.id)}?download=1`}
                    className="btn-accent2"
                    aria-label={`Download ${selectedGuide.title}`}
                    title={`Download ${selectedGuide.title}`}
                  >
                    <FiDownload aria-hidden="true" />
                  </a>
                </div>
              )}
              <button type="button" onClick={closeGuidePreview} className="admin-menu-close" aria-label="Close guide preview">
                <FiX size={22} aria-hidden="true" />
              </button>
            </div>
            {selectedGuide.type === "video" ? (
              <div className="guide-video-frame">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(selectedGuide.videoId)}?autoplay=1`}
                  title={selectedGuide.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : (
              <iframe
                className="guide-pdf-frame"
                src={`/api/guides/file/${encodeURIComponent(selectedGuide.id)}`}
                title={`${selectedGuide.title} PDF`}
              />
            )}
            {(selectedGuide.type === "file" || selectedGuide.checklist?.length > 0) && (
              <div className="guide-preview-toolbar">
                <div className="guide-preview-toolbar-label">
                  {selectedGuide.checklist?.length > 0 && <h3 id="guide-checklist-title">Checklist</h3>}
                </div>
              </div>
            )}
            {selectedGuide.checklist?.length > 0 && (
              <section className="guide-preview-checklist" aria-labelledby="guide-checklist-title">
                <ul>
                  {selectedGuide.checklist.map((item, index) => (
                    <li key={`${index}-${item}`}>
                      <label>
                        <input
                          type="checkbox"
                          checked={checkedChecklistItems.includes(index)}
                          onChange={() => setCheckedChecklistItems((current) => (
                            current.includes(index)
                              ? current.filter((itemIndex) => itemIndex !== index)
                              : [...current, index]
                          ))}
                        />
                        <span>{item}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}

      {canUpload && isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="guide-form-title">
          <div className="guide-upload-dialog w-full max-w-xl rounded-xl bg-white p-6 text-[#123243] shadow-2xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 id="guide-form-title" className="text-2xl font-bold">{editingGuide ? "Edit Guide" : "Upload Guide"}</h2>
              <button type="button" onClick={closeForm} className="admin-menu-close" aria-label="Close form">
                <FiX size={22} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={saveGuide} noValidate className="guide-upload-form grid gap-4">
              <label className="flex flex-col gap-1">
                <span>
                  Title
                  {touchedFields.title && !formData.title.trim() && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
                </span>
                <input
                  required
                  name="title"
                  maxLength={200}
                  minLength={0}
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
                <span>Guide type</span>
                <select
                  name="type"
                  value={formData.type}
                  onChange={updateGuideType}
                  className="rounded-md border-[1.5px] border-teal-400 p-2 text-neutral-900"
                >
                  <option value="file">Upload PDF</option>
                  <option value="video">Video Link</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span>Folder</span>
                <select
                  value={isCreatingFolder ? newFolderOption : formData.folder}
                  onChange={updateFolderChoice}
                  className="rounded-md border-[1.5px] border-teal-400 p-2 text-neutral-900"
                >
                  {folders.map((folder) => <option key={folder} value={folder}>{folder}</option>)}
                  <option value={newFolderOption}>Create a new folder...</option>
                </select>
              </label>
              {isCreatingFolder && (
                <label className="flex flex-col gap-1">
                  <span>New folder name</span>
                  <input
                    required
                    name="folder"
                    maxLength={100}
                    value={newFolderName}
                    onChange={updateNewFolderName}
                    onBlur={markFieldAsTouched}
                    placeholder="e.g. Clinic procedures"
                    aria-invalid={touchedFields.folder && !newFolderName.trim()}
                    className={`rounded-md border-[1.5px] p-2 text-neutral-900 ${touchedFields.folder && !newFolderName.trim() ? "border-red-500" : "border-teal-400"}`}
                  />
                  {touchedFields.folder && !newFolderName.trim() && <span className="text-sm text-red-600">A folder name is required.</span>}
                </label>
              )}
              <section className="guide-checklist-editor">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.checklistEnabled}
                    onChange={(event) => setFormData((current) => ({
                      ...current,
                      checklistEnabled: event.target.checked
                    }))}
                    className="h-4 w-4 accent-teal-700"
                  />
                  <span>Add a checklist</span>
                </label>
                {formData.checklistEnabled && (
                  <div className="guide-checklist-editor-content">
                    <p>Add up to 50 items. Users can check them off while the guide is open.</p>
                    <div className="guide-checklist-add">
                      <input
                        type="text"
                        value={checklistItem}
                        maxLength={300}
                        onChange={(event) => setChecklistItem(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addChecklistItem();
                          }
                        }}
                        placeholder="Checklist item"
                        aria-label="Checklist item"
                        disabled={formData.checklist.length >= 50}
                      />
                      <button
                        type="button"
                        onClick={addChecklistItem}
                        disabled={!checklistItem.trim() || formData.checklist.length >= 50}
                        aria-label="Add checklist item"
                      >
                        <FiPlus aria-hidden="true" />
                        Add item
                      </button>
                    </div>
                    {formData.checklist.length > 0 && (
                      <ul className="guide-checklist-items">
                        {formData.checklist.map((item, index) => (
                          <li key={`${index}-${item}`}>
                            <span>{item}</span>
                            <button type="button" onClick={() => removeChecklistItem(index)} aria-label={`Remove ${item}`}>
                              <FiX aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </section>
              {canUpload && isFormOpen && (
                <section className="guide-checklist-editor">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.partnerViewable}
                      onChange={(event) => setFormData((current) => ({
                        ...current,
                        partnerViewable: event.target.checked
                      }))}
                      className="h-4 w-4 accent-teal-700"
                    />
                    <span>Partner viewable</span>
                  </label>
                </section>
              )}
              {formData.type === "file" ? (
                <label className="flex flex-col gap-1">
                  <span>
                    Attach File
                    {touchedFields.fileData && !formData.fileData && !(editingGuide?.type === "file" && formData.fileName) && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
                  </span>
                  <input
                    required
                    name="fileData"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    onBlur={markFieldAsTouched}
                    aria-invalid={touchedFields.fileData && !formData.fileData && !(editingGuide?.type === "file" && formData.fileName)}
                    aria-describedby={touchedFields.fileData && !formData.fileData && !(editingGuide?.type === "file" && formData.fileName) ? "file-error" : undefined}
                    className={`text-neutral-400 rounded-md p-2 hover:text-neutral-900 transition-colors ${touchedFields.fileData && !formData.fileData && !(editingGuide?.type === "file" && formData.fileName) ? "border-red-500" : "border-[#d8e8e8]"}`}
                  />
                  {touchedFields.fileData && !formData.fileData && !(editingGuide?.type === "file" && formData.fileName) && <span id="file-error" className="text-sm text-red-600">A PDF file is required.</span>}
                  {formData.fileName && <span className="text-sm text-[#607984]">{editingGuide && !formData.fileData ? "Current file:" : "Selected:"} {formData.fileName}</span>}
                </label>
              ) : (
                <label className="flex flex-col gap-1">
                  <span>
                    YouTube Video URL
                    {touchedFields.videoUrl && !getYouTubeVideoId(formData.videoUrl) && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
                  </span>
                  <input
                    name="videoUrl"
                    type="url"
                    value={formData.videoUrl}
                    onChange={updateField}
                    onBlur={markFieldAsTouched}
                    placeholder="https://www.youtube.com/watch?v=..."
                    aria-invalid={touchedFields.videoUrl && !getYouTubeVideoId(formData.videoUrl)}
                    aria-describedby={touchedFields.videoUrl && !getYouTubeVideoId(formData.videoUrl) ? "video-url-error" : undefined}
                    className={`rounded-md border-[1.5px] p-2 text-neutral-900 ${touchedFields.videoUrl && !getYouTubeVideoId(formData.videoUrl) ? "border-red-500" : "border-teal-400"}`}
                  />
                  {touchedFields.videoUrl && !getYouTubeVideoId(formData.videoUrl) && <span id="video-url-error" className="text-sm text-red-600">Enter a valid YouTube video URL.</span>}
                </label>
              )}
              <div className="guide-upload-actions flex justify-end gap-3">
                <button type="button" onClick={closeForm} className="rounded-md border border-[#d8e8e8] px-4 py-2">Cancel</button>
                <button type="submit" disabled={isSaving || (formData.type === "file" ? !formData.fileData && !(editingGuide?.type === "file" && formData.fileName) : !getYouTubeVideoId(formData.videoUrl))} className="btn-accent inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <FiSave aria-hidden="true" />
                  {isSaving ? "Saving..." : editingGuide ? "Save changes" : "Save guide"}
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
