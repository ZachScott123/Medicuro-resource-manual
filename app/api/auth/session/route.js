import { getAuthenticatedUser, isEditorEmail, isAuthorizedEmail } from "@/app/lib/auth-session";
import { connectToDB } from "@/app/api/databases/db";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      isEditor: false,
      isAuthorized: false,
      isPhysicianSpecialist: false,
      email: null,
      name: "",
      picture: "",
      hasProfile: false,
      profileType: ""
    });
  }

  const email = (user.email || "").toLowerCase();
  let name = user.name || "";
  let picture = user.picture || "";
  let hasProfile = false;
  let profileType = "";

  try {
    const { db } = await connectToDB();
    const record = await db.collection("users").findOne({ email });

    if (record) {
      name = record.username || name;
      picture = record.picture || picture;
      hasProfile = Boolean(record.hasProfile);
      profileType = record.profileType || "";
    }
  } catch { }

  const isAuthorized = isAuthorizedEmail(email);

  return NextResponse.json({
    authenticated: true,
    isEditor: isEditorEmail(email),
    isAuthorized,
    isPhysicianSpecialist: !isAuthorized,
    email,
    name,
    picture,
    hasProfile,
    profileType
  });
}