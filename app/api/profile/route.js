import { connectToDB } from "@/app/api/databases/db";
import { connectToDB as connectToStaffDB } from "@/app/api/databases/staff-db";
import { connectToDB as connectToPartnersDB } from "@/app/api/databases/partners-db";
import { getAuthenticatedUser } from "@/app/lib/auth-session";
import { buildProfileIdFromEmail } from "@/app/lib/profile-id";
import { parseBody, userProfileSchema } from "@/app/api/validation";

const profileTargets = {
  Staff: {
    connect: connectToStaffDB,
    collection: "staff-members"
  },
  Physician: {
    connect: connectToPartnersDB,
    collection: "physician-partners"
  },
  Specialist: {
    connect: connectToPartnersDB,
    collection: "specialist-partners"
  }
};

const typeLabels = {
  Staff: "Medicuro Staff",
  Physician: "Physician Partner",
  Specialist: "Specialist Partner"
};

function serializeProfile(record) {
  if (!record) return null;

  return {
    name: record.name || "",
    position: record.position || "",
    email: record.email || "",
    phone: record.phone || "",
    imageUrl: record.imageUrl || "",
    location: record.location || "",
    about: record.about || "",
    profileType: record.profileType || "",
    id: record.id || ""
  };
}

async function findExistingProfile(email) {
  for (const [type, target] of Object.entries(profileTargets)) {
    const { db } = await target.connect();
    const record = await db.collection(target.collection).findOne({ email });

    if (record) {
      return { type, target, record };
    }
  }

  return null;
}

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.email?.toLowerCase();

  try {
    const { db } = await connectToDB();
    const userRecord = await db.collection("users").findOne({ email });

    if (userRecord?.profileType && profileTargets[userRecord.profileType]) {
      const target = profileTargets[userRecord.profileType];
      const { db: targetDB } = await target.connect();
      const record = await targetDB
        .collection(target.collection)
        .findOne({ email: userRecord.email });

      if (record) {
        return Response.json(serializeProfile(record));
      }
    }

    const existing = await findExistingProfile(email);
    if (existing) {
      return Response.json(serializeProfile(existing.record));
    }

    return Response.json(
      serializeProfile({
        email: user.email,
        name: userRecord?.username || user.name || "",
        imageUrl: userRecord?.picture || user.picture || ""
      })
    );
  } catch (e) {
    console.error("Unable to load profile:", e);
    return Response.json({ e: "Unable to load profile." }, { status: 500 });
  }
}

export async function PUT(request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ e: "Invalid request body." }, { status: 400 });
  }

  const email = user.email?.toLowerCase();

  if (!isAuthorizedEmail(email) && !["Physician", "Specialist"].includes(payload.profileType)) {
    return Response.json(
      { e: "Your account may only publish a Physician or Specialist profile." },
      { status: 403 }
    );
  }

  const target = profileTargets[payload.profileType];

  try {
    const { db } = await connectToDB();
    const userRecord = await db.collection("users").findOne({ email });
    let profileId = userRecord?.profileId;

    if (!profileId) {
      profileId = buildProfileIdFromEmail(email);
      await db
        .collection("users")
        .updateOne({ email }, { $set: { profileId } }, { upsert: true });
    }

    const profile = {
      id: profileId,
      name: payload.name,
      position: payload.position,
      email,
      phone: payload.phone,
      imageUrl: payload.imageUrl,
      location: payload.location,
      about: payload.about,
      profileType: payload.profileType
    };

    const parsed = parseBody(userProfileSchema, profile);
    if (parsed.error) {
      return Response.json({ e: parsed.error }, { status: 400 });
    }

    const data = parsed.data;
    const existing = await findExistingProfile(data.email);
    if (existing && existing.target.collection !== target.collection) {
      await existing.target.connect().then(({ db }) =>
        db.collection(existing.target.collection).deleteOne({ id: existing.record.id })
      );
    }

    const directoryRecord = {
      id: data.id,
      name: data.name,
      position: data.position || typeLabels[data.profileType],
      email: data.email,
      phone: data.phone,
      imageUrl: data.imageUrl,
      location: data.location,
      about: data.about
    };

    const { db: targetDB } = await target.connect();
    await targetDB
      .collection(target.collection)
      .replaceOne({ id: data.id }, directoryRecord, { upsert: true });

    await db.collection("users").updateOne(
      { email: data.email },
      {
        $set: {
          hasProfile: true,
          profileType: data.profileType,
          profileId: data.id
        }
      }
    );

    return Response.json({
      ...directoryRecord,
      profileType: data.profileType
    });
  } catch (e) {
    console.error("Unable to save profile:", e);
    return Response.json({ e: "Unable to save profile." }, { status: 500 });
  }
}

