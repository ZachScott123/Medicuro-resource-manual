import { getAuthenticatedUser } from "@/app/lib/auth-session";
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
  const access = user;
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

  return {
    authenticated: true,
    isEditor: access.isEditor,
    isAuthorized: access.isAuthorized,
    isPhysicianSpecialist: access.isPhysicianSpecialist,
    email,
    name,
    picture
  };
}
