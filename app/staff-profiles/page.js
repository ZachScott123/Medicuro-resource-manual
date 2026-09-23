import StaffManager from "@/app/components/manager/staff-manager/staff-manager";
import { getCurrentUser } from "@/app/lib/current-user";

export default async function StaffProfiles() {
  const { isEditor } = await getCurrentUser();

  return (
    <div className="directory-page mx-auto">
      <section className="directory-hero staff-hero">
        <div className="directory-hero-copy">
          <div className="eyebrow">— Medicuro team —</div>
          <h1>Meet the People Behind the Care</h1>
          <p>Meet the team behind accessible, patient-centered virtual healthcare for the communities we serve.</p>
        </div>
      </section>
      <StaffManager initialStaff={[]} isEditor={isEditor} />
    </div>
    
    );
}