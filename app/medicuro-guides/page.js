import GuideManager from "@/app/components/manager/guide-manager/guide-manager";

export default function Guides() {
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