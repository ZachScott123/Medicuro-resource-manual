"use client";

import { FiChevronLeft } from "react-icons/fi";

export default function BackButton() {
  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.assign("/");
  }

  return (
    <button type="button" onClick={goBack} className="back-button">
      <FiChevronLeft aria-hidden="true" />
    </button>
  );
}
