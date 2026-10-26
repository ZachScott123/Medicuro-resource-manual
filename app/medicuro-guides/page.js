import { redirect } from "next/navigation";
import GuideManager from "@/app/components/manager/guide-manager/guide-manager";
import { getCurrentUser } from "@/app/lib/current-user";

export default async function Guides() {
  const { authenticated, isAuthorized, isPhysicianSpecialist, isEditor } = await getCurrentUser();

  if (!authenticated) {
    redirect("/login");
  }

  if (!isAuthorized && !isPhysicianSpecialist) {
    redirect("/");
  }

  return (
    <div className="directory-page mx-auto">
      <section className="directory-hero guide-hero">
        <div className="directory-hero-copy">
          <div className="eyebrow">— Medicuro references —</div>
          <h1>Care Delivery Guides</h1>
          <p>Find the clinic procedures and reference materials you need. Search by topic or browse folders to get started.</p>
        </div>
      </section>
      <GuideManager
        initialGuides={[]}
        canManage={isAuthorized && isEditor}
        canUpload={isAuthorized}
      />
    </div>
  )
}