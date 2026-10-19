"use client";

import { createPortal } from "react-dom";

export default function ProfileEditDrawer({ labelledBy, onClose, children }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="profile-edit-drawer-layer">
      <button
        type="button"
        className="profile-edit-drawer-backdrop"
        aria-label="Close editor"
        onClick={onClose}
      />
      <section className="profile-edit-drawer" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </section>
    </div>,
    document.body
  );
}
