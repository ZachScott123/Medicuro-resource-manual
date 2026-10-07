import { redirect } from "next/navigation";
import Link from "next/link";
import { FiArrowRight, FiBookOpen, FiHeart, FiHome, FiUser, FiUsers } from "react-icons/fi";
import { getCurrentUser } from "@/app/lib/current-user";
import AdminNotes from "./admin-notes";

const adminLinks = [
  { href: "/", label: "Home", icon: FiHome },
  { href: "/staff-profiles", label: "Staff profiles", icon: FiUsers },
  { href: "/physician-partners", label: "Physician partners", icon: FiHeart },
  { href: "/specialist-partners", label: "Specialist partners", icon: FiUser },
  { href: "/medicuro-guides", label: "Care delivery guides", icon: FiBookOpen },
];

export default async function Admin() {
  const currentUser = await getCurrentUser();

  {/*if (!currentUser.authenticated) {
    redirect("/login");
  }

  if (!currentUser.isEditor) {
    redirect("/");
  }*/}
  
  return (
    <div className="directory-page mx-auto">
      <header className="admin-page-heading">
        <h1>Welcome, <span className="admin-page-name">{currentUser.name || "Administrator"}</span></h1>
      </header>
      <div className="admin-dashboard-layout">
        <aside className="admin-sidebar" aria-label="Admin workspace information">
          <div className="admin-sidebar-heading">
            <div className="admin-sidebar-logo-div">
              <img src="/medicuro-logo-white.png" alt="Medicuro" className="admin-menu-logo"/>
            </div>
            <h1 className="admin-page-kicker">Admin Workspace</h1>
            <p>Manage staff profiles, partner directories, and care delivery resources from one central workspace.</p>
          </div>
          <nav className="admin-sidebar-nav" aria-label="Admin shortcuts">
            <span className="admin-sidebar-label">Quick links</span>
            {adminLinks.map(({ href, label, icon: Icon }) => (
              <Link className="admin-sidebar-link" href={href} key={href}>
                <Icon aria-hidden="true" />
                <span>{label}</span>
                <FiArrowRight className="admin-sidebar-arrow" aria-hidden="true" />
              </Link>
            ))}
          </nav>
          <div className="admin-sidebar-note">
            <span className="admin-sidebar-label">Resource manual</span>
            <p>Updates to staff and partner directories help keep shared information current.</p>
          </div>
        </aside>
        <section className="directory-content">
          <div className="admin-notes-frame">
            <AdminNotes isEditor={currentUser.isEditor} />
          </div>
        </section>
      </div>
    </div>
  )
}