import { redirect } from "next/navigation";
import PhysicianManager from "@/app/components/manager/physician-manager/physician-manager";
import { getCurrentUser } from "@/app/lib/current-user";

export default async function PhysicianPartners() {
  const { authenticated, isEditor } = await getCurrentUser();

  if (!authenticated) {
    redirect("/login");
  }

  return (
        <div className="directory-page mx-auto">
            <section className="directory-hero physician-hero">
                <div className="directory-hero-copy">
                    <div className="eyebrow">— Medicuro physicians —</div>
                    <h1>Your Physician Partners</h1>
                    <p>Licensed professionals committed to delivering accessible, patient-centered virtual healthcare.</p>
                </div>
            </section>
            <PhysicianManager initialPhysicians={[]} isEditor={isEditor} />
        </div>
    );
}