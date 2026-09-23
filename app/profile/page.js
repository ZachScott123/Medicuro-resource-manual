import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/current-user";
import { connectToDB } from "@/app/api/databases/db";
import { connectToDB as connectToStaffDB } from "@/app/api/databases/staff-db";
import { connectToDB as connectToPartnersDB } from "@/app/api/databases/partners-db";
import ProfileEditor from "@/app/components/profile/profile-editor";

const profileTargets = {
  Staff: { connect: connectToStaffDB, collection: "staff-members" },
  Physician: { connect: connectToPartnersDB, collection: "physician-partners" },
  Specialist: { connect: connectToPartnersDB, collection: "specialist-partners" }
};

function defaultImageForType(type) {
  return type === "Physician" || type === "Specialist"
    ? "/default-profile-physician.svg"
    : "/default-profile.svg";
}

async function loadProfile(email) {
  const { db } = await connectToDB();
  const userRecord = await db.collection("users").findOne({ email });

  if (!userRecord) {
    return {
      name: "",
      position: "",
      email,
      phone: "",
      imageUrl: "/default-profile.svg",
      location: "",
      about: "",
      profileType: "Staff"
    };
  }

  const type = userRecord.profileType;
  if (!type || !profileTargets[type]) {
    return {
      name: userRecord.username || "",
      position: "",
      email,
      phone: "",
      imageUrl: "/default-profile.svg",
      location: "",
      about: "",
      profileType: "Staff"
    };
  }

  const target = profileTargets[type];
  const { db: targetDB } = await target.connect();
  const record = await targetDB.collection(target.collection).findOne({ email });

  if (!record) {
    return {
      name: userRecord.username || "",
      position: "",
      email,
      phone: "",
      imageUrl: defaultImageForType(type),
      location: "",
      about: "",
    profileType: type
  };
}

  return {
    name: record.name || "",
    position: record.position || "",
    email,
    phone: record.phone || "",
    imageUrl: record.imageUrl || defaultImageForType(type),
    location: record.location || "",
    about: record.about || "",
    profileType: type
  };
}

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user.authenticated) {
    redirect("/login");
  }

  const profile = await loadProfile(user.email);

  return (
    <main className="profile-page">
      <div className="directory-page mx-auto">
        <section className="profile-hero">
          <div className="directory-hero-copy">
            <h1>{user.name}'s Profile</h1>
            <p>Manage how your information appears across the site.</p>
          </div>
        </section>

        <ProfileEditor initialProfile={profile} accountEmail={user.email} />
      </div>
    </main>
  );
}

