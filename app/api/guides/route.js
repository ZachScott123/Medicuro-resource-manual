import { connectToDB } from "@/app/api/databases/partners-db";
import { getAuthenticatedUser } from "@/app/lib/auth-session";
import { guideSchema, parseBody } from "@/app/api/validation";

const collectionName = "guides";

function serializeGuide(record) {
  return {
    id: record.id || record._id?.toString(),
    title: record.title || "",
    description: record.description || "",
    fileName: record.fileName || "",
    fileData: record.fileData || "",
    createdAt: record.createdAt || ""
  };
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
    const records = await db.collection(collectionName).find({}).sort({ createdAt: -1 }).toArray();
    return Response.json(records.map(serializeGuide));

  } catch (e) {
    
    console.error("Unable to load guides:", e);
    return Response.json({ e: "Unable to load guides." }, { status: 500 });
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
    const parsed = parseBody(guideSchema, await request.json());
    if (parsed.error) return Response.json({ e: parsed.error }, { status: 400 });
    const guide = parsed.data;

    const record = {
      id: `${guide.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      title: guide.title.trim(),
      description: guide.description?.trim() || "...",
      fileName: guide.fileName,
      fileData: guide.fileData,
      createdAt: new Date().toISOString()
    };

    const { db } = await connectToDB();
    
    await db.collection(collectionName).insertOne(record);
    return Response.json(record, { status: 201 });

  } catch (e) {

    console.error("Unable to save guide:", e);
    return Response.json({ e: "Unable to save guide." }, { status: 500 });
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
    
    if (result.deletedCount === 0) return Response.json({ e: "Guide not found." }, { status: 404 });
    return Response.json({ id });

  } catch (e) {
    console.error("Unable to delete guide:", e);
    return Response.json({ e: "Unable to delete guide." }, { status: 500 });
  }
}
