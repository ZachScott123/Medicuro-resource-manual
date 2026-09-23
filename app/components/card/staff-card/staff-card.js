"use client";

import { useRouter } from "next/navigation";
import { FiEdit3, FiTrash2 } from "react-icons/fi";

const defaultProfileImage = "/default-profile.svg";

export default function StaffCard({ employee, editMode, onEdit, onDelete }) {
  const router = useRouter();

  return (
    <div className="profile-card">
      <div className="profile-card-heading">
        <div className="profile-card-name">{employee.name}</div>
        <div className="profile-card-role">{employee.position}</div>
      </div>

      <div className="profile-card-image">
        <img
          src={employee.imageUrl || defaultProfileImage}
          alt={employee.name}
          onError={(event) => {
            event.currentTarget.src = defaultProfileImage;
          }}
          className="rounded-xl object-cover"
          style={{ width: "160px", height: "160px", maxWidth: "160px", flexShrink: 0 }}
        />
      </div>

      <div className="profile-card-actions">
        {editMode && (
          <div className="mb-3 flex gap-2">
            <button type="button" onClick={() => onEdit(employee)} className="inline-flex items-center gap-2 rounded-full border border-[#d8e8e8] px-3 py-2 text-sm text-[#176183] hover:bg-[#edf8f7]">
              <FiEdit3 aria-hidden="true" />
              Edit Staff
            </button>
            <button type="button" onClick={() => onDelete(employee)} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50">
              <FiTrash2 aria-hidden="true" />
              Delete
            </button>
          </div>
        )}
        <button
          onClick={() => router.push(`/staff-profiles/${employee.id}`)}
          className="btn-accent w-full"
        >
          View Details
        </button>
      </div>
    </div>
  );
}