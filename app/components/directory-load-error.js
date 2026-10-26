import { FiAlertCircle } from "react-icons/fi";

export default function DirectoryLoadError({ onRetry }) {
  return (
    <div className="guide-empty-state guide-error-state directory-load-error" role="alert">
      <FiAlertCircle aria-hidden="true" />
      <h3>We couldn’t load the directory</h3>
      <p>Check your connection and try again.</p>
      <button type="button" className="btn-accent" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
