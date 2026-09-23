"use client";

import { useRouter } from "next/navigation";
import { FiEdit3, FiTrash2 } from "react-icons/fi";

const defaultProfileImage = "/default-profile-physician.svg";

export default function SpecialistCard({ specialist, editMode, onEdit, onDelete }) {
  const router = useRouter();

  return (
    <div className="profile-card">
      <div className="profile-card-heading">
        <div className="profile-card-name">{specialist.name}</div>
        <div className="profile-card-role">{specialist.position}</div>
      </div>
      <div className="profile-card-image">
        <img src={specialist.imageUrl || defaultProfileImage} alt={specialist.name} onError={(event) => { event.currentTarget.src = defaultProfileImage; }} className="rounded-xl object-cover" style={{ width: "160px", height: "160px", maxWidth: "160px", flexShrink: 0 }} />
      </div>
      <div className="profile-card-actions">
        {editMode && <div className="mb-3 flex gap-2">
          <button type="button" onClick={() => onEdit(specialist)} className="inline-flex items-center gap-2 rounded-full border border-[#d8e8e8] px-3 py-2 text-sm text-[#176183] hover:bg-[#edf8f7]"><FiEdit3 aria-hidden="true" />Edit Specialist</button>
          <button type="button" onClick={() => onDelete(specialist)} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"><FiTrash2 aria-hidden="true" />Delete</button>
        </div>}
        <button type="button" onClick={() => router.push(`/specialist-partners/${specialist.id}`)} className="btn-accent w-full">View Details</button>
      </div>
    </div>
  );
}