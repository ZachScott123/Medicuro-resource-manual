import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-copy">
        <span className="not-found-code">ERROR 404</span>
        <h1>Page not found</h1>
        <p>The page you requested could not be found. It may have moved, or the link may be out of date.</p>
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