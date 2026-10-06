import { connectToAuthDB } from "@/app/api/databases/db";
import { getAuthenticatedUser } from "@/app/lib/auth-session";

const listCollections = {
  administrators: "administrators",
  staff: "authenticated_staff",
  partners: "authenticated_partners"
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireAdmin() {
  try {
    const user = await getAuthenticatedUser({ requireEditor: true });
    if (!user) {
      return { response: Response.json({ error: "Unauthorized." }, { status: 401 }) };
    }
    return { user };
  } catch (error) {
    console.error("Unable to verify admin access:", error);
    return {
      response: Response.json({ error: "Unable to verify admin access." }, { status: 500 })
    };
  }
}

export async function GET() {
  const { response } = await requireAdmin();
  
  if (response) return response;

  try {
    const { db } = await connectToAuthDB();
    const lists = {};

    for (const [key, collectionName] of Object.entries(listCollections)) {
      const records = await db.collection(collectionName)
        .find({}, { projection: { email: 1 } })
        .toArray();

      lists[key] = [...new Set(
        records
          .map((record) => typeof record.email === "string" ? record.email.trim().toLowerCase() : "")
          .filter(Boolean)
      )].sort();
    }

    return Response.json(lists);
  } catch (error) {
    console.error("Unable to load authorization email lists:", error);
    return Response.json({ error: "Unable to load authorization email lists." }, { status: 500 });
  }
}

export async function PUT(request) {
  const { response } = await requireAdmin();

  if (response) return response;

  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const collectionName = Object.hasOwn(listCollections, body?.list) ? listCollections[body.list] : null;
  
  if (!collectionName || !Array.isArray(body?.emails)) {
    return Response.json({ error: "Choose a valid list and provide its email addresses." }, { status: 400 });
  }

  const emails = body.emails.map((email) => (
    typeof email === "string" ? email.trim().toLowerCase() : ""
  ));
  if (
    emails.some((email) => !email || email.length > 254 || !emailPattern.test(email)) ||
    new Set(emails).size !== emails.length
  ) {
    return Response.json({ error: "Enter valid, unique email addresses." }, { status: 400 });
  }

  if (body.list === "administrators" && emails.length === 0) {
    return Response.json({ error: "At least one administrator must remain." }, { status: 400 });
  }

  try {
    const { client, db } = await connectToAuthDB();
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        const collection = db.collection(collectionName);
        await collection.deleteMany({}, { session });
        
        if (emails.length > 0) {
          await collection.insertMany(
            emails.map((email) => ({ email })),
            { session }
          );
        }
      });
    } finally {
      
      await session.endSession();
    }

    return Response.json({ list: body.list, emails });
  } catch (error) {
    console.error("Unable to update authorization email list:", error);
    return Response.json({ error: "Unable to update authorization email list." }, { status: 500 });
  }
}
