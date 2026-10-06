"use client";

import "./globals.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FiMenu, FiX } from "react-icons/fi";

function NavLink({ href, children, className = "", onClick }) {
  const pathname = usePathname();
  const isActive = pathname == href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={["nav-link", className, isActive ? "nav-link-active" : ""].filter(Boolean).join(" ")}
    >
      {children}
    </Link>
  );
}

export default function RootLayout({ children }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [user, setUser] = useState({ name: "", picture: "", email: "" });
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";
  const isUnauthorizedPage = pathname === "/login-unauthorizedAccount";
  const isAuthPage = isLoginPage || isUnauthorizedPage;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((data) => {
        setIsLoggedIn(data.authenticated === true);
        setIsAuthorized(data.isAuthorized === true);
        setIsEditor(data.isEditor === true);
        setUser({
          name: data.name || "",
          picture: data.picture || "",
          email: data.email || ""
        });
      })
      .catch(() => {
        setIsLoggedIn(false);
        setIsAuthorized(false);
        setIsEditor(false);
        setUser({ name: "", picture: "", email: "" });
      });
    }, [pathname]);

  useEffect(() => {
    setIsNavOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsLoggedIn(false);
    setIsAuthorized(false);
    setIsEditor(false);
    setUser({ name: "", picture: "", email: "" });
    router.push("/");
    router.refresh();
  }

  const profileInitial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();
  const profileAlt = user.name ? `${user.name}'s profile` : "Your profile";

  return (
    <html lang="en">
        <body className={['min-h-screen flex flex-col antialiased', isAuthPage ? 'login-layout' : ''].filter(Boolean).join(' ')}>
                    {!isAuthPage && <nav className={['site-nav w-full', isScrolled ? 'site-nav-scrolled' : ''].filter(Boolean).join(' ')}>
            <div className="site-nav-inner">
              <Link href="/" className="brand-logo" aria-label="Medicuro home">
                <img src="/medicuro-logo-tag-line-1.png" alt="Medicuro" 
                      onMouseOver={(e) => (e.currentTarget.src = '/medicuro-logo-gradient.png')}
                      onMouseOut={(e) => (e.currentTarget.src = '/medicuro-logo-tag-line-1.png')}/>
              </Link>
              <button
                className="nav-toggle"
                type="button"
                aria-label={isNavOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isNavOpen}
                onClick={() => setIsNavOpen((current) => !current)}
              >
                {isNavOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
              </button>
              <div className={['nav-menu', isNavOpen ? 'nav-menu-open' : ''].filter(Boolean).join(' ')}>
                <div className="nav-links">
                  {(isLoggedIn && isEditor) && (
                    <NavLink className="nav-link-header" href="/admin" onClick={() => setIsNavOpen(false)}>Admin</NavLink>
                  )}
                  {(isLoggedIn && isAuthorized) && (
                  <NavLink className="nav-link-header" href="/medicuro-guides" onClick={() => setIsNavOpen(false)}>Guides</NavLink>
                  )}
                  <NavLink className="nav-link-header" href="/staff-profiles" onClick={() => setIsNavOpen(false)}>Staff</NavLink>
                  <NavLink className="nav-link-header" href="/physician-partners" onClick={() => setIsNavOpen(false)}>Physicians</NavLink>
                  <NavLink className="nav-link-header" href="/specialist-partners" onClick={() => setIsNavOpen(false)}>Specialists</NavLink>
                </div>
                {isLoggedIn ? (
                  <div className="nav-account">
                    <button className="btn-accent" onClick={handleLogout} type="button">
                      Logout
                    </button>
                    <Link href="/profile" className="profile-icon" aria-label={profileAlt} title={profileAlt}>
                      {user.picture ? (
                        <img src={user.picture} alt={profileAlt} referrerPolicy="no-referrer" />
                      ) : (
                        <span className="profile-icon-initial">{profileInitial}</span>
                      )}
                    </Link>
                  </div>
                ) : (
                  <button className="btn-accent nav-login" onClick={() => router.push("/login")} type="button">
                    <span>Login</span>
                  </button>
                )}
              </div>
            </div>
          </nav>}
        <main className="flex flex-1 w-full flex-col px-6">
          <div className="page-shell">
            {children}
          </div>
        </main>

                {!isAuthPage && <footer className="page-footer">
          <div className="page-footer-inner">
            <Link href="/" className="brand-logo page-footer-logo" aria-label="Medicuro home">
              <img src="/medicuro-tagline-logo-white.png" alt="Medicuro" />
            </Link>
            <div className="nav-links">
              {(isLoggedIn && isEditor) && (
                <>
                  <NavLink className="nav-link-footer" href="/admin" onClick={() => setIsNavOpen(false)}>Admin</NavLink>
                  <div className="nav-spacer">|</div>
                </>
              )}
              {(isLoggedIn || isAuthorized) && (
                <>
                  <NavLink className="nav-link-footer" href="/medicuro-guides">Guides</NavLink>
                  <div className="nav-spacer">|</div>                
                </>
              )}
                <NavLink className="nav-link-footer" href="/staff-profiles">Staff</NavLink>
              <div className="nav-spacer">|</div>
                <NavLink className="nav-link-footer" href="/physician-partners">Physicians</NavLink>
              <div className="nav-spacer">|</div>
                <NavLink className="nav-link-footer" href="/specialist-partners">Specialists</NavLink>
              </div>
            <span className="page-footer-note">Internal Resource Manual</span>
          </div>
      </footer>}
      </body>
    </html>
  );
}