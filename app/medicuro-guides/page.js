import { redirect } from "next/navigation";
import GuideManager from "@/app/components/manager/guide-manager/guide-manager";
import { getCurrentUser } from "@/app/lib/current-user";

export default async function Guides() {
  const { authenticated, isAuthorized } = await getCurrentUser();

  if (!authenticated) {
    redirect("/login");
  }

  if (!isAuthorized) {
    redirect("/");
  }

  return (
    <div className="directory-page mx-auto">
      <section className="directory-hero guide-hero">
        <div className="directory-hero-copy">
          <div className="eyebrow">— Medicuro references —</div>
          <h1>Care Delivery Guides</h1>
          <p>Keep clinic procedures, reference materials, and everyday resources in one reliable place.</p>
        </div>
      </section>
      <GuideManager initialGuides={[]} />
    </div>
  )
}