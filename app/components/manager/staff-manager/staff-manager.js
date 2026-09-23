"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiEdit3, FiSave, FiUpload, FiX, FiLock } from "react-icons/fi";
import { useRouter } from "next/navigation";
import StaffCard from "@/app/components/card/staff-card/staff-card";
import { compressImage } from "@/app/lib/compress-image";

const emptyStaffMember = {
  name: "",
  position: "",
  email: "",
  phone: "",
  imageUrl: "",
  location: "",
  about: ""
};

const requiredStaffFields = [
  { name: "name", label: "Name", placeholder: "Enter your name", type: "text", maxLength: 120 },
  { name: "position", label: "Position", placeholder: "Enter your position", type: "text", maxLength: 160 },
  { name: "email", label: "Email", placeholder: "Enter your email", type: "email", maxLength: 320 },
  { name: "phone", label: "Phone", placeholder: "(709) xxx xxxx", type: "text", maxLength: 40 }
];

export default function StaffManager({ initialStaff, isEditor = false }) {
  const [staff, setStaff] = useState(initialStaff);
  const [editMode, setEditMode] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyStaffMember);
  const [touchedFields, setTouchedFields] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const router = useRouter();

  function getLastName(name) {
    return String(name ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .at(-1)?.toUpperCase() ?? "";
  }

  const filteredStaff = [...staff].sort((a, b) => getLastName(a.name).localeCompare(getLastName(b.name)));

  useEffect(() => {
    fetch("/api/staff")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load staff records.");
        return response.json();
      })
      .then((records) => {
        setStaff(records);
        setIsLoading(false);
      })
      .catch(() => {
        setError("Access denied. Please login with an authorized account to access Staff Records.");
        setIsLoading(false);
      });
  }, [initialStaff]);

  function openCreateForm() {
    setEditingId(null);
    setFormData(emptyStaffMember);
    setTouchedFields({});
    setIsFormOpen(true);
  }

  function openEditForm(employee) {
    setEditingId(employee.id);
    setFormData({ ...emptyStaffMember, ...employee });
    setTouchedFields({});
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(emptyStaffMember);
    setTouchedFields({});
    setError("");
  }

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function markFieldAsTouched(event) {
    const { name } = event.target;
    setTouchedFields((current) => ({ ...current, [name]: true }));
  }

  function isRequiredFieldEmpty(name) {
    return !String(formData[name] ?? "").trim();
  }

  function renderRequiredField({ name, label, placeholder, type, maxLength }) {
    const isInvalid = touchedFields[name] && isRequiredFieldEmpty(name);
    const errorId = `${name}-error`;

    return (
      <label key={name} className="flex flex-col gap-1">

        <span>
          {label}
          {isInvalid && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
        </span>
        
        <input required type={type} name={name}
          value={formData[name]}
          onChange={updateField}
          onBlur={markFieldAsTouched}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-invalid={isInvalid}
          aria-describedby={isInvalid ? errorId : undefined}
          className={`rounded-md border-[1.5px] p-2 text-neutral-900 ${isInvalid ? "border-red-500" : "border-teal-400"}`}/>
        
        {isInvalid && (
          <span id={errorId} className="text-sm text-red-600">
            This field is required.
          </span>
        )}
      </label>
    );
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

  async function saveStaffMember(event) {
    event.preventDefault();

    const invalidFields = requiredStaffFields
      .map(({ name }) => name)
      .filter(isRequiredFieldEmpty);
    if (invalidFields.length > 0) {
      setTouchedFields((current) => ({
        ...current,
        ...Object.fromEntries(invalidFields.map((field) => [field, true]))
      }));
      document.querySelector(`[name="${invalidFields[0]}"]`)?.focus();
      return;
    }

    const staffDetails = { ...formData };
    const employee = {
      ...staffDetails,
      id: editingId || `${formData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      location: formData.location.trim(),
      about: formData.about.trim()
    };
    const response = await fetch("/api/staff", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employee)
    });

    if (!response.ok) {
      setError("Unable to save staff member. Please try again.");
      return;
    }

    const savedEmployee = await response.json();
    setStaff((current) => editingId
      ? current.map((item) => (item.id === editingId ? savedEmployee : item))
      : [...current, savedEmployee]);
    closeForm();
  }

  function requestDelete(employee) {
    setDeleteTarget(employee);
  }

  async function deleteStaffMember() {
    if (!deleteTarget) return;

    const response = await fetch("/api/staff", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id })
    });

    if (!response.ok) {
      setError("Unable to delete staff member. Please try again.");
      return;
    }

    setStaff((current) => current.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <div>
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
      ) : (
                staff.length > 0 ? (
            <span>
              {isEditor && (
                <div className="directory-toolbar flex-col gap-4 sm:flex-row">
                  <div className="flex flex-wrap gap-3 justify-end">
                    <button type="button" onClick={openCreateForm} className="btn-accent2 inline-flex items-center gap-2" aria-label="Upload staff member" title="Upload staff member">
                      <FiUpload aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => setEditMode((current) => !current)} className="btn-accent2 inline-flex items-center gap-2" aria-pressed={editMode} aria-label={editMode ? "Done editing staff" : "Edit staff"} title={editMode ? "Done editing staff" : "Edit staff"}>
                      {editMode ? <FiCheck aria-hidden="true" /> : <FiEdit3 aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              )}
              <div className="profile-grid">
                {filteredStaff.map((employee) => (
                  <StaffCard key={employee.id} employee={employee} editMode={isEditor && editMode} onEdit={openEditForm} onDelete={requestDelete} />
                ))}
              </div>
            </span>
        ) : (
          !error && <p>No staff profiles were found in the MongoDB staff collection.</p>
        )
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="staff-form-title">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 id="staff-form-title" className="text-2xl font-bold">
                {editingId ? "Edit Staff Member" : "Upload Staff Member"}
              </h2>
              <button type="button" onClick={closeForm} className="p-2 text-white/80 hover:text-white" aria-label="Close form">
                <FiX size={22} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={saveStaffMember} noValidate className="grid gap-4 sm:grid-cols-2">
              {requiredStaffFields.map(renderRequiredField)}
              <label className="flex flex-col gap-1">Location<input maxLength={200} name="location" value={formData.location} onChange={updateField} placeholder="123 Main Street, Town, NL" className="rounded-md p-2 text-neutral-900 border-[1.5px] border-teal-400" /></label>
              <label className="flex flex-col gap-1 sm:col-span-2">About<textarea maxLength={2000} name="about" value={formData.about} onChange={updateField} placeholder="Tell us about yourself..." rows={5} className="rounded-md p-2 text-neutral-900 border-[1.5px] border-teal-400" /></label>
              <label className="flex flex-col gap-1 sm:col-span-2">Image URL<input maxLength={7000000} name="imageUrl" value={formData.imageUrl} onChange={updateField} placeholder="/images/staff/name.jpg" className="rounded-md p-2 text-neutral-900 border-[1.5px] border-teal-400" /></label>
              <label className="flex flex-col gap-1 sm:col-span-2">Or upload an image<input type="file" accept="image/*" onChange={handleImageChange} className="text-neutral-400 rounded-md border border-white/20 p-2 hover:text-neutral-900 transition-colors" /></label>

              {formData.imageUrl && <img src={formData.imageUrl} alt="Staff preview" className="h-40 w-full rounded-lg object-cover sm:col-span-2" />}

              <div className="flex justify-end gap-3 sm:col-span-2">
                <button type="button" onClick={closeForm} className="rounded-md border border-white/30 px-4 py-2">Cancel</button>
                <button type="submit" className="btn-accent inline-flex items-center gap-2"><FiSave aria-hidden="true" />Save Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div id="delete-form" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-staff-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-[#123243] shadow-2xl">
            <h2 id="delete-staff-title" className="text-xl font-bold">Delete {deleteTarget.name}?</h2>
            <p className="mt-2 text-sm text-[#607984]">This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-full border border-[#d8e8e8] px-4 py-2 text-sm font-bold text-[#176183]">Cancel</button>
              <button type="button" onClick={deleteStaffMember} className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
