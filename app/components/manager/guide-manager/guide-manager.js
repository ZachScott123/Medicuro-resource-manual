"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FiAlertCircle, FiArrowLeft, FiDownload, FiBookOpen, FiEdit, FiExternalLink, FiFileText, FiTv, FiFolder, FiGrid, FiLink, FiLink2, FiPlay, FiPlus, FiSave, FiSearch, FiTrash2, FiUpload, FiX } from "react-icons/fi";
import PageControls from "@/app/components/page-controls";


const emptyGuide = {
  title: "",
  description: "",
  folder: "Uncategorized",
  partnerViewable: false,
  type: "file",
  fileName: "",
  fileData: "",
  videoUrl: "",
  url: "",
  checklistEnabled: false,
  checklist: []
};

const allFolders = "all";
const linksFolder = "__links__";
const newFolderOption = "__new_folder__";
const ITEMS_PER_PAGE = 18;

function getWebsiteIconUrl(value) {
  try {
    const url = new URL(value);
    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url.origin)}&sz=128`;
  } catch {
    return "";
  }
}

function isValidHttpUrl(value) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function getWebsiteTitle(value) {
  try {
    const hostname = new URL(value).hostname.replace(/^www\./i, "");
    return hostname ? `${hostname[0].toUpperCase()}${hostname.slice(1)}`.slice(0, 200) : "";
  } catch {
    return "";
  }
}

function WebsiteIcon({ url }) {
  const [hasError, setHasError] = useState(false);
  const iconUrl = getWebsiteIconUrl(url);

  return (
    <span className="guide-link-icon" aria-hidden="true">
      {iconUrl && !hasError
        ? <Image src={iconUrl} alt="" width={32} height={32} unoptimized onError={() => setHasError(true)} />
        : <FiLink2 />}
    </span>
  );
}

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
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLinkFormOpen, setIsLinkFormOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [linkError, setLinkError] = useState("");
  const [isSavingLink, setIsSavingLink] = useState(false);
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
  const [isRenameFolderOpen, setIsRenameFolderOpen] = useState(false);
  const [renameFolderName, setRenameFolderName] = useState("");
  const [renameFolderError, setRenameFolderError] = useState("");
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);
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

  const linkItems = guides.filter((guide) => guide.type === "link");
  const libraryGuides = guides.filter((guide) => guide.type !== "link");
  const folders = [...new Set(guides.map((guide) => guide.folder || "Uncategorized"))]
    .sort((first, second) => first.localeCompare(second));
  if (folders.length === 0) folders.push("Uncategorized");
  const populatedFolders = folders.filter((folder) =>
    libraryGuides.some((guide) => (guide.folder || "Uncategorized") === folder)
  );
  const query = searchQuery.trim().toLowerCase();
  const visibleResources = selectedFolder === linksFolder ? linkItems : libraryGuides;
  const filteredGuides = visibleResources.filter((guide) => {
    const matchesFolder = selectedFolder === null || selectedFolder === allFolders || selectedFolder === linksFolder || (guide.folder || "Uncategorized") === selectedFolder;
    const matchesQuery = !query || [guide.title, guide.description, guide.fileName, guide.folder, guide.url]
      .some((field) => field?.toLowerCase().includes(query));
    return matchesFolder && matchesQuery;
  });
  const pageCount = Math.max(1, Math.ceil(filteredGuides.length / ITEMS_PER_PAGE));
  const visibleGuides = filteredGuides.slice(
    (Math.min(currentPage, pageCount) - 1) * ITEMS_PER_PAGE,
    Math.min(currentPage, pageCount) * ITEMS_PER_PAGE
  );
  const isFolderMenu = selectedFolder === null && !query && guides.length > 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFolder]);

  function isFolderPartnerViewable(folder) {
    const folderGuides = guides.filter((guide) => guide.type !== "link" && (guide.folder || "Uncategorized") === folder);
    return folderGuides.length > 0 && folderGuides.every((guide) => guide.partnerViewable === true);
  }

  const selectedFolderPartnerViewable = selectedFolder !== null && selectedFolder !== allFolders && selectedFolder !== linksFolder && isFolderPartnerViewable(selectedFolder);

  function openForm(type = "file") {
    const folder = folders[0] || "Uncategorized";
    setEditingGuide(null);
    setFormData({
      ...emptyGuide,
      type,
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
      url: guide.type === "link" ? guide.url || "" : "",
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

  function openLinkForm() {
    setLinkUrl("");
    setLinkDescription("");
    setLinkError("");
    setIsLinkFormOpen(true);
  }

  function closeLinkForm() {
    setLinkUrl("");
    setLinkDescription("");
    setLinkError("");
    setIsLinkFormOpen(false);
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
      videoUrl: "",
      url: "",
      checklist: [],
      checklistEnabled: false
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

  function openRenameFolder() {
    setRenameFolderName(selectedFolder);
    setRenameFolderError("");
    setIsRenameFolderOpen(true);
  }

  async function renameFolder(event) {
    event.preventDefault();
    const newFolder = renameFolderName.trim();
    if (!selectedFolder || !newFolder) return;

    setIsRenamingFolder(true);
    setRenameFolderError("");

    try {
      const response = await fetch("/api/guides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: selectedFolder, newFolder })
      });

      if (!response.ok) {
        setRenameFolderError("Unable to rename folder. Please try again.");
        return;
      }

      setGuides((current) => current.map((guide) =>
        (guide.folder || "Uncategorized") === selectedFolder
          ? { ...guide, folder: newFolder }
          : guide
      ));
      setSelectedFolder(newFolder);
      setIsRenameFolderOpen(false);

    } catch {
      setRenameFolderError("Unable to rename folder. Please try again.");
    } finally {
      setIsRenamingFolder(false);
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
      formData.type === "link" && !isValidHttpUrl(formData.url) && "url",
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
      partnerViewable: formData.type !== "link" && formData.partnerViewable,
      type: formData.type,
      checklist: formData.type !== "link" && formData.checklistEnabled ? formData.checklist : [],
      ...(formData.type === "video"
        ? {
          videoId: getYouTubeVideoId(formData.videoUrl)
        }
        : formData.type === "link"
          ? { url: formData.url.trim() }
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
        : formData.type === "link"
          ? "Unable to save link. Please enter a valid HTTP or HTTPS URL."
          : "Unable to save guide. Please choose a PDF and try again.");
      setIsSaving(false);
      return;
    }

    const savedGuide = await response.json();
    setGuides((current) => {
      const updatedGuides = current.map((item) => {
        if (item.id === savedGuide.id) return savedGuide;
        return savedGuide.type !== "link" && (item.folder || "Uncategorized") === savedGuide.folder
          ? { ...item, partnerViewable: savedGuide.partnerViewable }
          : item;
      });
      
      return editingGuide ? updatedGuides : [savedGuide, ...updatedGuides];
    });
    setSelectedFolder(savedGuide.type === "link" ? linksFolder : savedGuide.folder);
    setIsSaving(false);
    closeForm();
  }

  async function saveLink(event) {
    event.preventDefault();
    const url = linkUrl.trim();
    if (!isValidHttpUrl(url)) {
      setLinkError("Enter a valid HTTP or HTTPS website URL.");
      return;
    }

    setIsSavingLink(true);
    setLinkError("");
    try {
      const response = await fetch("/api/guides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: getWebsiteTitle(url),
          description: linkDescription.trim(),
          type: "link",
          url
        })
      });

      if (!response.ok) {
        setLinkError("Unable to add this link. Check the URL and try again.");
        return;
      }

      const savedLink = await response.json();
      setGuides((current) => [savedLink, ...current]);
      setSelectedFolder(linksFolder);
      closeLinkForm();
    } catch {
      setLinkError("Unable to add this link. Check your connection and try again.");
    } finally {
      setIsSavingLink(false);
    }
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
      selectedFolder &&
      selectedFolder !== allFolders &&
      selectedFolder !== linksFolder &&
      !(remainingGuides.some((guide) => (guide.folder || "Uncategorized") === selectedFolder))
    ) {
      setSelectedFolder(allFolders);
    }
    setDeleteTarget(null);
  }

  return (
    <section className="guide-library" aria-label="Care delivery resources">

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
                placeholder="Search guides, documents, and links"
                aria-label="Search resources by name, description, file, or URL"
              />
            </label>
            {canUpload && selectedFolder !== linksFolder && (
              <button
                type="button"
                onClick={() => openForm()}
                className="btn-accent3 inline-flex items-center gap-2"
                aria-label="Upload a guide"
                title="Upload a guide"
              >
                <FiUpload aria-hidden="true" />
                <span>Upload Guide</span>
              </button>
            )}
          </div>

          {isFolderMenu ? (
            <>
            {libraryGuides.length > 0 && (
            <nav className="guide-folder-navigation" aria-label="Browse guide folders">
              <span className="guide-folder-navigation-label">Browse folders</span>
              <div className="guide-folder-menu">
                <button
                  type="button"
                  className="guide-folder-card guide-view-all-card"
                  onClick={() => setSelectedFolder(allFolders)}
                >
                  <span className="guide-folder-card-icon"><FiGrid aria-hidden="true" /></span>
                  <span className="guide-folder-card-copy">
                    <strong>View All Guides</strong>
                    <small><b>{libraryGuides.length}</b> {libraryGuides.length === 1 ? "item" : "items"}</small>
                  </span>
                </button>
                {populatedFolders.map((folder) => {
                  const folderCount = libraryGuides.filter((guide) => (guide.folder || "Uncategorized") === folder).length;
                  return (
                    <button
                      type="button"
                      className="guide-folder-card"
                      key={folder}
                      onClick={() => setSelectedFolder(folder)}
                    >
                      <span className="guide-folder-card-icon"><FiFolder aria-hidden="true" /></span>
                      <span className="guide-folder-card-copy">
                        <strong>{folder}</strong>
                        <small><b>{folderCount}</b> {folderCount === 1 ? "item" : "items"}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
            )}
            {canUpload && selectedFolder !== linksFolder && (
              <nav className="guide-folder-navigation" aria-label="Browse links">
                <span className="guide-folder-navigation-label">Browse links</span>
                <div className="guide-folder-menu">
                  <button
                    type="button"
                    className="guide-folder-card guide-view-all-card"
                    onClick={() => setSelectedFolder(linksFolder)}
                  >
                    <span className="guide-folder-card-icon"><FiLink aria-hidden="true" /></span>
                    <span className="guide-folder-card-copy">
                      <strong>View Links</strong>
                      <small><b>{linkItems.length}</b> {linkItems.length === 1 ? "link" : "links"}</small>
                    </span>
                  </button>
                </div>
              </nav>
            )}
            </>
          ) : (
            <>
              {(selectedFolder !== null || query) && <div className="guide-folder-content-header">
                <button
                  type="button"
                  className="guide-back-button"
                  onClick={() => {
                    setSelectedFolder(null);
                    setSearchQuery("");
                  }}
                  aria-label="Back to resource sections"
                >
                  <FiArrowLeft aria-hidden="true" />
                  <span>Back</span>
                </button>
                <div className="guide-folder-heading">
                  <div>
                    <span className="guide-folder-heading-label">
                      {selectedFolder === linksFolder ? "Resource library" : selectedFolder === allFolders ? "Library" : query ? "Search results" : "Folder"}
                    </span>
                    <h2 className="guide-folder-title">
                      {selectedFolder === linksFolder ? "Links" : selectedFolder === allFolders ? "All guides" : selectedFolder || "Search results"}
                    </h2>
                  </div>
                </div>
                <div className="guide-folder-actions">
                  {canUpload && selectedFolder !== null && selectedFolder !== allFolders && selectedFolder !== linksFolder && (
                    <div className="guide-folder-permission guide-folder-access">
                      <button type="button" onClick={openRenameFolder}>
                        Rename Folder
                      </button>
                    </div>
                  )}
                  {canUpload && selectedFolder !== null && selectedFolder !== allFolders && selectedFolder !== linksFolder && (
                    <div className="guide-folder-permission guide-folder-access">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedFolderPartnerViewable}
                          onChange={updateFolderPartnerViewable}
                          disabled={isSavingFolderPermission}
                          className="h-4 w-4 accent-teal-700"
                        />
                        <span>Partner Viewable</span>
                      </label>
                      {folderPermissionError && <p role="alert">{folderPermissionError}</p>}
                    </div>
                  )}
                  {canUpload && selectedFolder === linksFolder && (
                    <button class="btn-accent3 gap-2" type="button" onClick={openLinkForm} aria-label="Add links">
                      <FiPlus aria-hidden="true" />
                      <span>Add Links</span>
                    </button>
                  )}
                </div>
              </div>}

          <div className="guide-results-summary" aria-live="polite">
            <strong>{filteredGuides.length}</strong> {selectedFolder === linksFolder
              ? filteredGuides.length === 1 ? "link" : "links"
              : filteredGuides.length === 1 ? "item" : "items"}
            {searchQuery && <span> matching your search</span>}
          </div>

          {filteredGuides.length > 0 ? (
            <>
              <div className={selectedFolder === linksFolder ? "link-grid" : "guide-grid"}>
                {visibleGuides.map((guide) => selectedFolder === linksFolder ? (
                  <article className="guide-card guide-link-card" key={guide.id}>
                    <WebsiteIcon url={guide.url} />
                    <div className="guide-card-copy">
                      <h3>{guide.title}</h3>
                      <a className="guide-link-url" href={isValidHttpUrl(guide.url) ? guide.url : undefined} target="_blank" rel="noopener noreferrer">
                        <FiLink2 aria-hidden="true" />
                        {guide.url}
                      </a>
                      {guide.description && guide.description !== "..." && (
                        <p className="guide-link-description">{guide.description}</p>
                      )}
                    </div>
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
                  </article>
                ) : (
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
                          <button type="button" onClick={() => requestDelete(guide)} className="guide-management-button guide-management-delete" aria-label={`Delete ${guide.title}`} title={`Delete ${guide.title}`}>
                            <FiTrash2 aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            <PageControls
              itemCount={filteredGuides.length}
              page={Math.min(currentPage, pageCount)}
              pageSize={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}/>
            </>
          ) : guides.length > 0 ? (
            <div className="guide-empty-state">
              <FiSearch aria-hidden="true" />
              <h3>{selectedFolder === linksFolder ? "No links found" : "No guides found"}</h3>
              <p>Try another search term or return to the resource list.</p>
            </div>
          ) : (
            <div className="guide-empty-state">
              <FiFileText aria-hidden="true" />
              <h3>{canUpload ? "Your guide library is ready" : "No guides are available yet"}</h3>
              <p>{canUpload
                ? "Add a PDF, video, or link to make your team’s first resource easy to find."
                : "There are no guides or links shared with your account right now. Contact your clinic administrator if you need access."}</p>
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
          <div className={`guide-video-dialog${selectedGuide.type === "file" ? " guide-pdf-dialog" : ""}`}>
            <div className={`guide-preview-header mb-4 flex items-center justify-between gap-4${selectedGuide.type === "file" ? " guide-pdf-preview-header" : ""}`}>
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
            {selectedGuide.checklist?.length > 0 && (
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

      {canUpload && isLinkFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="add-link-title">
          <div className="guide-upload-dialog w-full max-w-xl rounded-xl bg-white p-6 text-[#123243] shadow-2xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 id="add-link-title" className="text-2xl font-bold">Add Link</h2>
              <button type="button" onClick={closeLinkForm} className="admin-menu-close" aria-label="Close add link form" disabled={isSavingLink}>
                <FiX size={22} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={saveLink} noValidate className="guide-upload-form grid gap-4">
              <label className="flex flex-col gap-1">
                <span>Website URL</span>
                <input
                  autoFocus
                  name="linkUrl"
                  type="url"
                  value={linkUrl}
                  onChange={(event) => {
                    setLinkUrl(event.target.value);
                    setLinkError("");
                  }}
                  maxLength={2048}
                  placeholder="https://example.com"
                  aria-invalid={Boolean(linkError) || (linkUrl.length > 0 && !isValidHttpUrl(linkUrl))}
                  aria-describedby={linkError || (linkUrl.length > 0 && !isValidHttpUrl(linkUrl)) ? "add-link-url-error" : undefined}
                  className={`rounded-md border-[1.5px] p-2 text-neutral-900 ${linkError || (linkUrl.length > 0 && !isValidHttpUrl(linkUrl)) ? "border-red-500" : "border-teal-400"}`}
                />
                {(linkError || (linkUrl.length > 0 && !isValidHttpUrl(linkUrl))) && (
                  <span id="add-link-url-error" className="text-sm text-red-600" role={linkError ? "alert" : undefined}>
                    {linkError || "Enter a valid HTTP or HTTPS website URL."}
                  </span>
                )}
              </label>

              <label className="flex flex-col gap-1">
                <span>Description</span>
                <textarea
                  name="linkDescription"
                  value={linkDescription}
                  onChange={(event) => setLinkDescription(event.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Add helpful context regarding this link"
                  className="rounded-md border-[1.5px] border-teal-400 p-2 text-neutral-900"
                />
              </label>

              <article className="guide-card guide-link-card" aria-live="polite">
                <WebsiteIcon key={linkUrl} url={linkUrl} />
                <div className="guide-card-copy">
                  <h3>{getWebsiteTitle(linkUrl) || "Website title"}</h3>
                  <a className="guide-link-url" href={isValidHttpUrl(linkUrl) ? linkUrl : undefined} target="_blank" rel="noopener noreferrer">
                    <FiLink2 aria-hidden="true" />
                    {linkUrl || "Website URL"}
                  </a>
                  {linkDescription.trim() && (
                    <p className="guide-link-description">{linkDescription.trim()}</p>
                  )}
                </div>
              </article>

              <div className="guide-upload-actions flex justify-end gap-3">
                <button type="button" onClick={closeLinkForm} disabled={isSavingLink} className="rounded-md border border-[#d8e8e8] px-4 py-2 disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSavingLink || !isValidHttpUrl(linkUrl)} className="btn-accent inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <FiPlus aria-hidden="true" />
                  {isSavingLink ? "Adding..." : "Add Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {canUpload && isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="guide-form-title">
          <div className="guide-upload-dialog w-full max-w-xl rounded-xl bg-white p-6 text-[#123243] shadow-2xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 id="guide-form-title" className="text-2xl font-bold">
                {editingGuide ? formData.type === "link" ? "Edit Link" : "Edit Guide" : formData.type === "link" ? "Add Link" : "Upload Guide"}
              </h2>
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
                  placeholder="Resource title"
                  aria-invalid={touchedFields.title && !formData.title.trim()}
                  aria-describedby={touchedFields.title && !formData.title.trim() ? "title-error" : undefined}
                  className={`rounded-md border-[1.5px] p-2 text-neutral-900 ${touchedFields.title && !formData.title.trim() ? "border-red-500" : "border-teal-400"}`}
                />
                {touchedFields.title && !formData.title.trim() && <span id="title-error" className="text-sm text-red-600">This field is required.</span>}
              </label>
              <label className="flex flex-col gap-1">Description
                <textarea maxLength={1400} name="description" value={formData.description} onChange={updateField} placeholder="What is this resource for?" rows={3} className="rounded-md border-[1.5px] border-teal-400 p-2 text-neutral-900" />
              </label>
              {formData.type !== "link" && (
                <>
                  <label className="flex flex-col gap-1">
                    <span>Resource type</span>
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
                </>
              )}
              {formData.type !== "link" && isCreatingFolder && (
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
              {formData.type !== "link" && <section className="guide-checklist-editor">
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
              </section>}
              {canUpload && isFormOpen && formData.type !== "link" && (
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
              ) : formData.type === "video" ? (
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
              ) : (
                <label className="flex flex-col gap-1">
                  <span>
                    Website URL
                    {touchedFields.url && !isValidHttpUrl(formData.url) && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
                  </span>
                  <input
                    name="url"
                    type="url"
                    value={formData.url}
                    onChange={updateField}
                    onBlur={markFieldAsTouched}
                    placeholder="https://example.com"
                    aria-invalid={touchedFields.url && !isValidHttpUrl(formData.url)}
                    aria-describedby={touchedFields.url && !isValidHttpUrl(formData.url) ? "link-url-error" : undefined}
                    className={`rounded-md border-[1.5px] p-2 text-neutral-900 ${touchedFields.url && !isValidHttpUrl(formData.url) ? "border-red-500" : "border-teal-400"}`}
                  />
                  {touchedFields.url && !isValidHttpUrl(formData.url) && <span id="link-url-error" className="text-sm text-red-600">Enter a valid HTTP or HTTPS URL.</span>}
                </label>
              )}
              {editingGuide && formData.type === "link" && (
                <article className="guide-card guide-link-card" aria-live="polite">
                  <WebsiteIcon key={formData.url} url={formData.url} />
                  <div className="guide-card-copy">
                    <h3>{formData.title || "Website title"}</h3>
                    <a className="guide-link-url" href={isValidHttpUrl(formData.url) ? formData.url : undefined} target="_blank" rel="noopener noreferrer">
                      <FiLink2 aria-hidden="true" />
                      {formData.url || "Website URL"}
                    </a>
                    {formData.description.trim() && formData.description.trim() !== "..." && (
                      <p className="guide-link-description">{formData.description.trim()}</p>
                    )}
                  </div>
                </article>
              )}
              <div className="guide-upload-actions flex justify-end gap-3">
                <button type="button" onClick={closeForm} className="rounded-md border border-[#d8e8e8] px-4 py-2">Cancel</button>
                <button type="submit" disabled={isSaving || (formData.type === "file" ? !formData.fileData && !(editingGuide?.type === "file" && formData.fileName) : formData.type === "video" ? !getYouTubeVideoId(formData.videoUrl) : !isValidHttpUrl(formData.url))} className="btn-accent inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <FiSave aria-hidden="true" />
                  {isSaving ? "Saving..." : editingGuide ? "Save changes" : formData.type === "link" ? "Save link" : "Save guide"}
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
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-md border border-[#d8e8e8] px-4 py-2 text-sm text-[#176183]">Cancel</button>
              <button type="button" onClick={deleteGuide} className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {isRenameFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="rename-folder-title">
          <form onSubmit={renameFolder} className="w-full max-w-md rounded-2xl bg-white p-6 text-[#123243] shadow-2xl">
            <h2 id="rename-folder-title" className="text-xl font-bold">Rename Folder</h2>
            <label htmlFor="rename-folder-name" className="mt-4 block text-sm">Folder Name:</label>
            <input
              id="rename-folder-name"
              type="text"
              value={renameFolderName}
              onChange={(event) => setRenameFolderName(event.target.value)}
              maxLength={100}
              required
              disabled={isRenamingFolder}
              className="mt-2 w-full rounded-md border border-[#d8e8e8] px-3 py-2"
            />
            {renameFolderError && <p className="mt-2 text-sm text-red-600" role="alert">{renameFolderError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setIsRenameFolderOpen(false)} disabled={isRenamingFolder} className="rounded-md border border-[#d8e8e8] px-4 py-2 text-sm text-[#176183] disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={isRenamingFolder || !renameFolderName.trim()} className="btn-accent disabled:cursor-not-allowed disabled:opacity-50">
                {isRenamingFolder ? "Confirm" : "Confirm"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
