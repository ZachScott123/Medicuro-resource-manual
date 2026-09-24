import { getAuthenticatedUser, isEditorEmail, isAuthorizedEmail } from "@/app/lib/auth-session";
import { connectToDB } from "@/app/api/databases/db";

export async function getCurrentUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      authenticated: false,
      isEditor: false,
      isAuthorized: false,
      isPhysicianSpecialist: false,
      email: null,
      name: "",
      picture: ""
    };
  }

  const email = (user.email || "").toLowerCase();
  let name = user.name || "";
  let picture = user.picture || "";

  try {
    const { db } = await connectToDB();
    const record = await db.collection("users").findOne({ email });

    if (record) {
      name = record.username || name;
      picture = record.picture || picture;
    }
  } catch {}

  const isAuthorized = isAuthorizedEmail(email);

  return {
    authenticated: true,
    isEditor: isEditorEmail(email),
    isAuthorized,
    isPhysicianSpecialist: !isAuthorized,
    email,
    name,
    picture
  };
}
