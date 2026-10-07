import { connectToDB as connectToStaffDB } from "@/app/api/databases/staff-db";
import { connectToDB as connectToPartnersDB } from "@/app/api/databases/partners-db";
import { connectToAuthDB } from "@/app/api/databases/db";
import { getAuthenticatedUser } from "@/app/lib/auth-session";

export async function GET() {
  try {
    const user = await getAuthenticatedUser({ requireEditor: true });
    if (!user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const [{ db: staffDB }, { db: partnersDB }, { db: authDB }] = await Promise.all([
      connectToStaffDB(),
      connectToPartnersDB(),
      connectToAuthDB()
    ]);

    const [
      staffProfiles,
      physicians,
      specialists,
      staffAccounts,
      partnerAccounts,
      administrators
    ] = await Promise.all([
      staffDB.collection("staff-members").countDocuments(),
      partnersDB.collection("physician-partners").countDocuments(),
      partnersDB.collection("specialist-partners").countDocuments(),
      authDB.collection("authenticated_staff").countDocuments(),
      authDB.collection("authenticated_partners").countDocuments(),
      authDB.collection("administrators").countDocuments()
    ]);

    return Response.json({
      staff: staffProfiles,
      partners: physicians + specialists,
      accounts: staffAccounts + partnerAccounts,
      administrators
    });
  } catch (error) {
    console.error("Unable to load admin dashboard counts:", error);
    return Response.json(
      { error: "Unable to load admin dashboard counts." },
      { status: 500 }
    );
  }
}
