"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiSave, FiLock } from "react-icons/fi";
import { compressImage } from "@/app/lib/compress-image";

const PROFILE_TYPES = ["Staff", "Physician", "Specialist"];

const DEFAULT_PROFILE_IMAGE = "/default-profile.svg";
const DEFAULT_PHYSICIAN_IMAGE = "/default-profile-physician.svg";

// Maps each profile type to the default image used when the user hasn't set their own.
const defaultImageByProfileType = {
  Staff: DEFAULT_PROFILE_IMAGE,
  Physician: DEFAULT_PHYSICIAN_IMAGE,
  Specialist: DEFAULT_PHYSICIAN_IMAGE
};

const emptyProfile = {
  name: "",
  position: "",
  email: "",
  phone: "",
  imageUrl: DEFAULT_PROFILE_IMAGE,
  location: "",
  about: "",
  profileType: "Staff"
};

const requiredFields = [
  { name: "name", label: "Name", placeholder: "Enter your name", type: "text", maxLength: 120 },
  { name: "position", label: "Position", placeholder: "e.g. Physician Partner, Virtual Healthcare Assistant", type: "text", maxLength: 160 },
  { name: "phone", label: "Phone", placeholder: "(709) xxx xxxx", type: "text", maxLength: 40 }
];

export default function ProfileEditor({ initialProfile, accountEmail }) {
  const router = useRouter();
  const [formData, setFormData] = useState({ ...emptyProfile, ...initialProfile });
  const [touchedFields, setTouchedFields] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const previewImage = formData.imageUrl || DEFAULT_PROFILE_IMAGE;
  const accountName = initialProfile?.name || formData.name || accountEmail;

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setSavedMessage("");
  }

  function handleProfileTypeChange(event) {
    const { value } = event.target;

    setFormData((current) => {
      const currentImage = current.imageUrl || "";
      const isDefaultImage = Object.values(defaultImageByProfileType).includes(currentImage);

      // Only swap the image when it's still a default one, so a user's
      // custom upload or URL is never overwritten by a role change.
      const nextImageUrl = isDefaultImage
        ? defaultImageByProfileType[value] || DEFAULT_PROFILE_IMAGE
        : current.imageUrl;

      return { ...current, profileType: value, imageUrl: nextImageUrl };
    });

    setSavedMessage("");
  }

  function markFieldAsTouched(event) {
    const { name } = event.target;
    setTouchedFields((current) => ({ ...current, [name]: true }));
  }

  function isRequiredFieldEmpty(name) {
    return !String(formData[name] ?? "").trim();
  }

  function startEditing() {
    setFormData({ ...emptyProfile, ...initialProfile, email: accountEmail });
    setTouchedFields({});
    setError("");
    setSavedMessage("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setFormData({ ...emptyProfile, ...initialProfile, email: accountEmail });
    setTouchedFields({});
    setError("");
    setIsEditing(false);
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const compressedImage = await compressImage(file);
      setFormData((current) => ({ ...current, imageUrl: compressedImage }));
    } catch {
      setError("Unable to process that image. Please choose another file.");
    }
  }

  async function saveProfile(event) {
    event.preventDefault();

    const invalidFields = requiredFields
      .map(({ name }) => name)
      .filter(isRequiredFieldEmpty);

    if (!formData.profileType) {
      invalidFields.push("profileType");
    }

    if (invalidFields.length > 0) {
      setTouchedFields((current) => ({
        ...current,
        ...Object.fromEntries(invalidFields.map((field) => [field, true]))
      }));
      setError("Please complete the highlighted fields before saving.");
      return;
    }

    setIsSaving(true);
    setError("");

    const payload = {
      ...formData,
      email: accountEmail,
      location: formData.location.trim(),
      about: formData.about.trim()
    };

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setIsSaving(false);

    if (!response.ok) {
      let detail = "";
      try {
        const body = await response.json();
        detail = body?.e || body?.error || "";
      } catch {
        detail = "";
      }
      setError(detail ? `Unable to save your profile: ${detail}` : "Unable to save your profile. Please try again.");
      return;
    }

    const savedProfile = await response.json();
    setFormData({ ...savedProfile, email: accountEmail });
    setIsEditing(false);
    setSavedMessage("Your profile has been saved and published to the site.");
    router.refresh();
  }

  if (!isEditing) {
    return (
      <div className="profile-editor">
        {savedMessage && (
          <div className="profile-banner profile-banner-success" role="status">
            {savedMessage}
          </div>
        )}

        <article className="profile-detail-card">
          <header className="profile-detail-header">
            <h1>{formData.name || "Your Profile"}</h1>
            <p className="profile-detail-role">
              {formData.position || "Add your position"}
              {formData.profileType ? ` · ${formData.profileType}` : ""}
            </p>
          </header>

          <div className="profile-detail-main">
            <div className="profile-detail-image">
              <img
                src={previewImage}
                alt={formData.name || accountName}
                onError={(event) => { event.currentTarget.src = "/default-profile.svg"; }}/>

              <div>
                <dl className="profile-detail-contact">
                  <div><dt>Email</dt><dd>{accountEmail}</dd></div>
                  <div><dt>Phone</dt><dd>{formData.phone || "Not provided"}</dd></div>
                  <div><dt>Location</dt><dd>{formData.location || "Not provided"}</dd></div>
                  <div><dt>Role</dt><dd>{formData.profileType || "Not selected"}</dd></div>
                </dl>
              </div>
            </div>

            <div className="profile-detail-info">
              <section className="profile-detail-about" aria-labelledby="profile-about">
                <h2 id="profile-about">About</h2>
                <p>{formData.about || "No additional information has been provided."}</p>
              </section>

              <div className="profile-editor-actions">
                <button type="button" className="btn-accent inline-flex items-center gap-2" onClick={startEditing}>
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="profile-editor">
      {error && (
        <div className="profile-banner profile-banner-error inline-flex items-center gap-2" role="alert">
          <FiLock aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <article className="profile-detail-card">
        <header className="profile-detail-header">
          <h1>Edit Your Profile</h1>
          <p className="profile-detail-role">Update how you appear across the Medicuro directories.</p>
        </header>

        <form onSubmit={saveProfile} noValidate className="profile-form">
          <div className="profile-form-grid">
            <div className="profile-form-fields">
              {requiredFields.map(({ name, label, placeholder, type, maxLength }) => {
                const isInvalid = touchedFields[name] && isRequiredFieldEmpty(name);
                const errorId = `${name}-error`;

                return (
                  <label key={name} className="profile-form-field">
                    <span>
                      {label}
                      {isInvalid && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
                    </span>
                    <input
                      type={type}
                      name={name}
                      value={formData[name]}
                      onChange={updateField}
                      onBlur={markFieldAsTouched}
                      placeholder={placeholder}
                      maxLength={maxLength}
                      aria-invalid={isInvalid}
                      aria-describedby={isInvalid ? errorId : undefined}
                      className={`rounded-md border-[1.5px] p-2 text-neutral-900 ${isInvalid ? "border-red-500" : "border-teal-400"}`}/>

                    {isInvalid && <span id={errorId} className="text-sm text-red-600">This field is required.</span>}
                  </label>
                );
              })}

              <label className="profile-form-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={accountEmail}
                  readOnly
                  disabled
                  className="rounded-md border-[1.5px] border-teal-200 bg-teal-50/60 p-2 text-neutral-500"/>

                <span className="profile-form-hint">Your email is tied to your Medicuro account and cannot be changed here.</span>
              </label>

              <label className="profile-form-field">
                <span>
                  Role
                  {touchedFields.profileType && !formData.profileType && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
                </span>
                <select
                  name="profileType"
                  value={formData.profileType}
                  onChange={handleProfileTypeChange}
                  onBlur={markFieldAsTouched}
                  className="rounded-md border-[1.5px] border-teal-400 p-2 text-neutral-900">

                  {PROFILE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <span className="profile-form-hint">This determines which directory your profile is published to.</span>
              </label>

              <label className="profile-form-field">
                <span>Location</span>
                <input
                  maxLength={200}
                  name="location"
                  value={formData.location}
                  onChange={updateField}
                  placeholder="123 Main Street, Town, NL"
                  className="rounded-md border-[1.5px] border-teal-400 p-2 text-neutral-900"/>
              </label>

              <label className="profile-form-field">
                <span>About</span>
                <textarea
                  maxLength={2000}
                  name="about"
                  value={formData.about}
                  onChange={updateField}
                  placeholder="Tell us about yourself..."
                  rows={5}
                  className="rounded-md border-[1.5px] border-teal-400 p-2 text-neutral-900"/>

              </label>

              <label className="profile-form-field">
                <span>Image URL</span>
                <input
                  maxLength={7000000}
                  name="imageUrl"
                  value=""
                  onChange={updateField}
                  placeholder="/images/profile/name.jpg"
                  className="rounded-md border-[1.5px] border-teal-400 p-2 text-neutral-900"/>

              </label>

              <label className="profile-form-field">
                <span>Or upload an image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="profile-form-file rounded-md border border-teal-200 p-2"/>

              </label>
            </div>

            <aside className="profile-form-preview">
              <p className="profile-form-preview-label">Live Preview</p>
              <div className="profile-card">
                <div className="profile-card-heading">
                  <div className="profile-card-name">{formData.name || "Your Name"}</div>
                  <div className="profile-card-role">{formData.position || "Your Position"}</div>
                </div>
                <div className="profile-card-image">
                  <img
                    src={previewImage}
                    alt="Profile preview"
                    onError={(event) => { event.currentTarget.src = "/default-profile.svg"; }}
                    className="rounded-xl object-cover"
                    style={{ width: "160px", height: "160px", maxWidth: "160px", flexShrink: 0 }}/>
                    
                </div>
                <div className="profile-card-actions">
                  <span className="profile-card-view btn-accent w-full inline-flex justify-center">
                    {formData.profileType || "Staff"}
                  </span>
                </div>
              </div>
            </aside>
          </div>

          <div className="profile-form-actions">
            <button type="button" className="profile-form-cancel" onClick={cancelEditing} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn-accent inline-flex items-center gap-2" disabled={isSaving}>
              <FiSave aria-hidden="true" />
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}
