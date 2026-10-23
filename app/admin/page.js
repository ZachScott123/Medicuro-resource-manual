import { getCurrentUser } from "@/app/lib/current-user";
import AdminNotes from "./admin-notes";

export default async function Admin() {
  const currentUser = await getCurrentUser();

  if (!currentUser.authenticated) {
    redirect("/login");
  }

  if (!currentUser.isEditor) {
    redirect("/");
  }
  
  return (
    <div className="directory-page mx-auto">
      <header className="admin-page-heading">
        <h1>Welcome, {currentUser.name || "Administrator"}</h1>
      </header>
      <div className="admin-dashboard-layout">
        <section className="directory-content" aria-labelledby="admin-overview-title">
          <div className="admin-notes-frame">
            <h2 className="sr-only" id="admin-overview-title">Admin overview</h2>
            <AdminNotes isEditor={currentUser.isEditor} />
          </div>
        </section>
      </div>
    </div>
  )
}