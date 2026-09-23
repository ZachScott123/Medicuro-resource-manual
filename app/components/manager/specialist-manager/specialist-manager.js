"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiEdit3, FiSave, FiUpload, FiX, FiLock } from "react-icons/fi";
import { useRouter } from "next/navigation";
import SpecialistCard from "@/app/components/card/specialist-card/specialist-card";
import { compressImage } from "@/app/lib/compress-image";

const emptySpecialist = {
	name: "",
	position: "",
	email: "",
	phone: "",
	imageUrl: "",
	location: "",
	about: ""
};

const requiredSpecialistFields = [
	{ name: "name", label: "Name", placeholder: "Enter your name", type: "text", maxLength: 120 },
	{ name: "position", label: "Position", placeholder: "Enter your position", type: "text", maxLength: 160 },
	{ name: "email", label: "Email", placeholder: "Enter your email", type: "email", maxLength: 320 },
	{ name: "phone", label: "Phone", placeholder: "(709) xxx xxxx", type: "text", maxLength: 40 }
];

export default function SpecialistManager({ initialSpecialists, isEditor = false }) {
	const [specialists, setSpecialists] = useState(initialSpecialists);
	const [editMode, setEditMode] = useState(false);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [formData, setFormData] = useState(emptySpecialist);
	const [touchedFields, setTouchedFields] = useState({});
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const router = useRouter();

	function getLastName(name) {
		const trimmed = String(name ?? "").trim();
		const drMatch = trimmed.match(/^Dr\.?\s+([A-Za-z][A-Za-z'-]*)/i);
		if (drMatch) return drMatch[1].toUpperCase();

		return trimmed
			.split(/\s+/)
			.filter(Boolean)
			.at(-1)?.toUpperCase() ?? "";
	}

	const filteredSpecialists = [...specialists].sort((a, b) => getLastName(a.name).localeCompare(getLastName(b.name)));

	useEffect(() => {
		fetch("/api/specialist")
			.then((response) => {
				if (!response.ok) throw new Error("Unable to load specialist records.");
				return response.json();
			})
			.then((records) => {
				setSpecialists(records);
				setIsLoading(false);
			})
			.catch(() => {
				setError("Access denied. Please login with an authorized account to access Specialist Records.");
				setIsLoading(false);
			});
	}, [initialSpecialists]);

	function openCreateForm() {
		setEditingId(null);
		setFormData(emptySpecialist);
		setTouchedFields({});
		setIsFormOpen(true);
	}

	function openEditForm(specialist) {
		setEditingId(specialist.id);
		setFormData({ ...emptySpecialist, ...specialist });
		setTouchedFields({});
		setIsFormOpen(true);
	}

	function closeForm() {
		setIsFormOpen(false);
		setEditingId(null);
		setFormData(emptySpecialist);
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
				<input
					required
					type={type}
					name={name}
					value={formData[name]}
					onChange={updateField}
					onBlur={markFieldAsTouched}
					placeholder={placeholder}
					maxLength={maxLength}
					aria-invalid={isInvalid}
					aria-describedby={isInvalid ? errorId : undefined}
					className={`rounded-md border-[1.5px] p-2 text-neutral-900 ${isInvalid ? "border-red-500" : "border-teal-400"}`}
				/>
				{isInvalid && <span id={errorId} className="text-sm text-red-600">This field is required.</span>}
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

	async function saveSpecialist(event) {
		event.preventDefault();

		const invalidFields = requiredSpecialistFields
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

		const specialist = {
			...formData,
			id: editingId || `${formData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
			location: formData.location.trim(),
			about: formData.about.trim()
		};
		const response = await fetch("/api/specialist", {
			method: editingId ? "PUT" : "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(specialist)
		});

		if (!response.ok) {
			setError("Unable to save specialist. Please try again.");
			return;
		}

		const savedSpecialist = await response.json();
		setSpecialists((current) => editingId
			? current.map((item) => (item.id === editingId ? savedSpecialist : item))
			: [...current, savedSpecialist]);
		closeForm();
	}

	function requestDelete(specialist) {
		setDeleteTarget(specialist);
	}

	async function deleteSpecialist() {
		if (!deleteTarget) return;
		const response = await fetch("/api/specialist", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: deleteTarget.id })
		});

		if (!response.ok) {
			setError("Unable to delete specialist. Please try again.");
			return;
		}

		setSpecialists((current) => current.filter((item) => item.id !== deleteTarget.id));
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
						) : specialists.length > 0 ? (
				<span>
					{isEditor && (
						<div className="directory-toolbar flex-col gap-4 sm:flex-row">
							<div className="flex flex-wrap gap-3 justify-end">
								<button type="button" onClick={openCreateForm} className="btn-accent2 inline-flex items-center gap-2" aria-label="Upload specialist" title="Upload specialist">
									<FiUpload aria-hidden="true" />
								</button>
								<button type="button" onClick={() => setEditMode((current) => !current)} className="btn-accent2 inline-flex items-center gap-2" aria-pressed={editMode} aria-label={editMode ? "Done editing specialists" : "Edit specialists"} title={editMode ? "Done editing specialists" : "Edit specialists"}>
									{editMode ? <FiCheck aria-hidden="true" /> : <FiEdit3 aria-hidden="true" />}
								</button>
							</div>
						</div>
					)}
					<div className="profile-grid">
						{filteredSpecialists.map((specialist) => <SpecialistCard key={specialist.id} specialist={specialist} editMode={isEditor && editMode} onEdit={openEditForm} onDelete={requestDelete} />)}
					</div>
				</span>
			) : (
				!error && <p>No specialist partners were found in the MongoDB specialist-partners collection.</p>
			)}

			{isFormOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="specialist-form-title">
					<div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
						<div className="mb-6 flex items-center justify-between gap-4">
							<h2 id="specialist-form-title" className="text-2xl font-bold">{editingId ? "Edit Specialist" : "Upload Specialist"}</h2>
							<button type="button" onClick={closeForm} className="p-2 text-white/80 hover:text-white" aria-label="Close form"><FiX size={22} aria-hidden="true" /></button>
						</div>
						<form onSubmit={saveSpecialist} noValidate className="grid gap-4 sm:grid-cols-2">
							{requiredSpecialistFields.map(renderRequiredField)}
							<label className="flex flex-col gap-1">Location<input maxLength={200} name="location" value={formData.location} onChange={updateField} placeholder="123 Main Street, Town, NL" className="rounded-md p-2 text-neutral-900 border-[1.5px] border-teal-400" /></label>
							<label className="flex flex-col gap-1 sm:col-span-2">About<textarea maxLength={2000} name="about" value={formData.about} onChange={updateField} placeholder="Tell us about yourself..." rows={5} className="rounded-md p-2 text-neutral-900 border-[1.5px] border-teal-400" /></label>
							<label className="flex flex-col gap-1 sm:col-span-2">Image URL<input maxLength={7000000} name="imageUrl" value={formData.imageUrl} onChange={updateField} placeholder="/images/specialists/name.jpg" className="rounded-md p-2 text-neutral-900 border-[1.5px] border-teal-400" /></label>
							<label className="flex flex-col gap-1 sm:col-span-2">Or upload an image<input type="file" accept="image/*" onChange={handleImageChange} className="rounded-md border border-white/20 p-2" /></label>
							{formData.imageUrl && <img src={formData.imageUrl} alt="Specialist preview" className="h-40 w-full rounded-lg object-cover sm:col-span-2" />}
							<div className="flex justify-end gap-3 sm:col-span-2">
								<button type="button" onClick={closeForm} className="rounded-md border border-white/30 px-4 py-2">Cancel</button>
								<button type="submit" className="btn-accent inline-flex items-center gap-2"><FiSave aria-hidden="true" />Save Specialist</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{deleteTarget && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-specialist-title">
					<div className="w-full max-w-md rounded-2xl bg-white p-6 text-[#123243] shadow-2xl">
						<h2 id="delete-specialist-title" className="text-xl font-bold">Delete {deleteTarget.name}?</h2>
						<p className="mt-2 text-sm text-[#607984]">This action cannot be undone.</p>
						<div className="mt-6 flex justify-end gap-3">
							<button type="button" onClick={() => setDeleteTarget(null)} className="rounded-full border border-[#d8e8e8] px-4 py-2 text-sm font-bold text-[#176183]">Cancel</button>
							<button type="button" onClick={deleteSpecialist} className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">Delete</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
