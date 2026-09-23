import { connectToDB } from "@/app/api/databases/partners-db";
import { getAuthenticatedUser } from "@/app/lib/auth-session";
import { parseBody, providerSchema } from "@/app/api/validation";

const collectionName = "specialist-partners";

function serializeSpecialist(record) {
  return {
    id: record.id || record._id?.toString(),
    name: record.name || "",
    position: record.position || "",
    email: record.email || "",
    phone: record.phone || "",
    imageUrl: record.imageUrl || "",
    location: record.location || "",
    about: record.about || ""
  };
}

function validateSpecialist(record) {
  return parseBody(providerSchema, record);
}

export async function GET() {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { db } = await connectToDB();
    const records = await db.collection(collectionName).find({}).sort({ name: 1 }).toArray();
    
    return Response.json(records.map(serializeSpecialist));
  
  } catch (e) {
    
    console.error("Unable to load specialist records:", e);
    return Response.json({ e: "Unable to load specialist records." }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getAuthenticatedUser({ requireEditor: true });
  
  if (!user) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const parsed = validateSpecialist(await request.json());
    if (parsed.error) return Response.json({ e: parsed.error }, { status: 400 });
    const specialist = parsed.data;
    
    const { db } = await connectToDB();
    
    if (await db.collection(collectionName).findOne({ id: specialist.id })) return Response.json({ e: "A specialist with that ID already exists." }, { status: 409 });
    
    await db.collection(collectionName).insertOne(specialist);
    
    return Response.json(specialist, { status: 201 });
  
  } catch (e) {
    console.error("Unable to save specialist:", e);
    return Response.json({ e: "Unable to save specialist." }, { status: 500 });
  }
}

export async function PUT(request) {
  const user = await getAuthenticatedUser({ requireEditor: true });
  
  if (!user) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const parsed = validateSpecialist(await request.json());
    if (parsed.error) return Response.json({ e: parsed.error }, { status: 400 });
    const specialist = parsed.data;
    
    const { db } = await connectToDB();
    const result = await db.collection(collectionName).replaceOne({ id: specialist.id }, specialist);
    
    if (result.matchedCount === 0) return Response.json({ e: "Specialist not found." }, { status: 404 });
    
    return Response.json(specialist);
  
  } catch (e) {
    console.error("Unable to update specialist:", e);
    return Response.json({ e: "Unable to update specialist." }, { status: 500 });
  }
}

export async function DELETE(request) {
  const user = await getAuthenticatedUser({ requireEditor: true });
  
  if (!user) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { id } = await request.json();
    const { db } = await connectToDB();
    const result = await db.collection(collectionName).deleteOne({ id });
    
    if (result.deletedCount === 0) return Response.json({ e: "Specialist not found." }, { status: 404 });
    
    return Response.json({ id });
  
  } catch (e) {
    
    console.error("Unable to delete specialist:", e);
    return Response.json({ e: "Unable to delete specialist." }, { status: 500 });
  }
}