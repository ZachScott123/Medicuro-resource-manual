"use client";

import "./globals.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

function NavLink({ href, children, className = "" }) {
  const pathname = usePathname();
  const isActive = pathname == href;

  return (
    <Link
      href={href}
      className={["nav-link", className, isActive ? "nav-link-active" : ""].filter(Boolean).join(" ")}
    >
      {children}
    </Link>
  );
}

export default function RootLayout({ children }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
        setUser({
          name: data.name || "",
          picture: data.picture || "",
          email: data.email || ""
        });
      })
      .catch(() => {
        setIsLoggedIn(false);
        setUser({ name: "", picture: "", email: "" });
      });
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsLoggedIn(false);
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
            <div className="flex w-full items-center justify-start gap-6 px-6 py-4 transition-all duration-200">
              <Link href="/" className="brand-logo" aria-label="Medicuro home">
                <img src="/medicuro-logo-tag-line-1.svg" alt="Medicuro" />
              </Link>
              <div className="nav-links">
                <NavLink className="nav-link-header" href="/staff-profiles">Staff</NavLink>
                <NavLink className="nav-link-header" href="/physician-partners">Physicians</NavLink>
                <NavLink className="nav-link-header" href="/specialist-partners">Specialists</NavLink>
                <NavLink className="nav-link-header" href="/medicuro-guides">Guides</NavLink>
              </div>
              {isLoggedIn ? (
                <div className="nav-account ml-auto">
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
                <button className="btn-accent ml-auto" onClick={() => router.push("/login")} type="button">
                  <span>Login</span>
                </button>
              )}
            </div>
          </nav>}
        <main className="flex flex-1 w-full flex-col px-6">
          {children}
        </main>

        {!isAuthPage && <footer className="page-footer">
          <Link href="/" className="brand-logo" aria-label="Medicuro home">
            <img src="/medicuro-tagline-logo-white.svg" alt="Medicuro" />
          </Link>
          <div className="nav-links">
              <NavLink className="nav-link-footer" href="/staff-profiles">Staff</NavLink>
            <div className="nav-spacer">|</div>  
              <NavLink className="nav-link-footer" href="/physician-partners">Physicians</NavLink>
            <div className="nav-spacer">|</div>  
              <NavLink className="nav-link-footer" href="/specialist-partners">Specialists</NavLink>
            <div className="nav-spacer">|</div>  
              <NavLink className="nav-link-footer" href="/medicuro-guides">Guides</NavLink>
          </div>
          <span>Internal Resource Manual</span>
      </footer>}
      </body>
    </html>
  );
}