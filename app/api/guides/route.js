import { connectToDB } from "@/app/api/databases/guides-db";
import { getAuthenticatedUser, isAuthorizedEmail } from "@/app/lib/auth-session";
import { guideFolderSchema, guideSchema, parseBody } from "@/app/api/validation";

const collectionName = "guides";

function folderQuery(folder) {
  if (folder !== "Uncategorized") return { folder };

  return {
    $or: [
      { folder: "Uncategorized" },
      { folder: { $exists: false } },
      { folder: null },
      { folder: "" }
    ]
  };
}

function serializeGuide(record) {
  return {
    id: record.id || record._id?.toString(),
    title: record.title || "",
    description: record.description || "",
    folder: record.folder || "Uncategorized",
    fileName: record.fileName || "",
    fileData: record.fileData || "",
    createdAt: record.createdAt || "",
    partnerViewable: record.partnerViewable === true
  };
}

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user || (!user.isAuthorized && !user.isPhysicianSpecialist)) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { db } = await connectToDB();
    const query = user.isPhysicianSpecialist && !user.isAuthorized && !user.isEditor
      ? { partnerViewable: true }
      : {};
    const records = await db.collection(collectionName).find(query).sort({ createdAt: -1 }).toArray();
    return Response.json(records.map(serializeGuide));

  } catch (e) {
    
    console.error("Unable to load guides:", e);
    return Response.json({ e: "Unable to load guides." }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getAuthenticatedUser();

  if (!user?.isAuthorized) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const parsed = parseBody(guideSchema, await request.json());
    if (parsed.error) return Response.json({ e: parsed.error }, { status: 400 });
    const guide = parsed.data;
    const folder = guide.folder?.trim() || "Uncategorized";
    const { db } = await connectToDB();
    const guides = db.collection(collectionName);
    const record = {
      id: `${guide.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      title: guide.title.trim(),
      description: guide.description?.trim() || "...",
      folder,
      partnerViewable: guide.partnerViewable === true,
      fileName: guide.fileName,
      fileData: guide.fileData,
      createdAt: new Date().toISOString()
    };

    await guides.updateMany(folderQuery(record.folder), {
      $set: { partnerViewable: record.partnerViewable }
    });
    await guides.insertOne(record);
    return Response.json(record, { status: 201 });

  } catch (e) {

    console.error("Unable to save guide:", e);
    return Response.json({ e: "Unable to save guide." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const user = await getAuthenticatedUser();

  if (!user?.isAuthorized) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const parsed = parseBody(guideFolderSchema, await request.json());
    if (parsed.error) return Response.json({ e: parsed.error }, { status: 400 });

    const { folder, partnerViewable } = parsed.data;
    const { db } = await connectToDB();
    const result = await db.collection(collectionName).updateMany(
      folderQuery(folder),
      { $set: { partnerViewable } }
    );

    if (result.matchedCount === 0) {
      return Response.json({ e: "Folder not found." }, { status: 404 });
    }

    return Response.json({ folder, partnerViewable });
  } catch (e) {
    console.error("Unable to update guide folder access:", e);
    return Response.json({ e: "Unable to update guide folder access." }, { status: 500 });
  }
}

export async function DELETE(request) {
  const user = await getAuthenticatedUser({ requireEditor: true });

  if (!user || !(await isAuthorizedEmail(user.email))) {
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