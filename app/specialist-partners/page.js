import SpecialistManager from "@/app/components/manager/specialist-manager/specialist-manager";
import { getCurrentUser } from "@/app/lib/current-user";

export default async function SpecialistPartners() {
  const { isEditor } = await getCurrentUser();

  return (
        <div className="directory-page mx-auto">
            <section className="directory-hero specialist-hero">
                <div className="directory-hero-copy">
                    <div className="eyebrow">— Medicuro specialists —</div>
                    <h1>Our Specialist Network</h1>
                    <p>Dedicated specialists helping deliver timely, connected, patient-centered care across the network.</p>
                </div>
            </section>
            <SpecialistManager initialSpecialists={[]} isEditor={isEditor} />
        </div>
    );
}