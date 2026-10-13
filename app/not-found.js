import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-copy">
        <span className="not-found-code">404 — PAGE NOT FOUND</span>
        <h1>This page isn't available.</h1>
        <p>The page may have moved, or the link may be out of date.</p>
        <Link className="btn-accent" href="/">Return to home</Link>
      </div>
      <img
        className="not-found-art"
        src="/medicuro-error-page.png"
        alt="A browser window with an alert symbol"
      />
    </main>
  );
}