import { getAuthenticatedUser, isEditorEmail } from "@/app/lib/auth-session";
import { connectToDB } from "@/app/api/databases/db";

export async function getCurrentUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { authenticated: false, isEditor: false, email: null, name: "", picture: "" };
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

  return {
    authenticated: true,
    isEditor: isEditorEmail(email),
    email,
    name,
    picture
  };
}
