import { connectToDB } from "@/app/api/databases/partners-db";
import { getAuthenticatedUser } from "@/app/lib/auth-session";
import { parseBody, providerSchema } from "@/app/api/validation";

const collectionName = "physician-partners";

function serializePhysician(employee) {
  return {
    id: employee.id || employee._id?.toString(),
    name: employee.name || "",
    position: employee.position || "",
    email: employee.email || "",
    phone: employee.phone || "",
    imageUrl: employee.imageUrl || "",
    location: employee.location || "",
    about: employee.about || ""
  };
}

function validatePhysician(employee) {
  return parseBody(providerSchema, employee);
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
    
    return Response.json(records.map(serializePhysician));
  
  } catch (e) {
    console.error("Unable to load physician records:", e);
    return Response.json({ e: "Unable to load physician records." }, { status: 500 });
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
    const parsed = validatePhysician(await request.json());
    if (parsed.error) {
      return Response.json({ e: parsed.error }, { status: 400 });
    }
    const employee = parsed.data;
    const { db } = await connectToDB();
    const existingEmployee = await db.collection(collectionName).findOne({ id: employee.id });

    if (existingEmployee) {
      return Response.json({ e: "A physician with that ID already exists." }, { status: 409 });
    }

    await db.collection(collectionName).insertOne(employee);
    return Response.json(employee, { status: 201 });

  } catch (e) {
    console.error("Unable to save physician:", e);
    return Response.json({ e: "Unable to save physician." }, { status: 500 });
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
    const parsed = validatePhysician(await request.json());
    if (parsed.error) {
      return Response.json({ e: parsed.error }, { status: 400 });
    }
    const employee = parsed.data;

    const { db } = await connectToDB();
    const result = await db.collection(collectionName).replaceOne(
      { id: employee.id },
      employee
    );

    if (result.matchedCount === 0) {
      return Response.json({ e: "Physician not found." }, { status: 404 });
    }

    return Response.json(employee);
  } catch (e) {
    console.error("Unable to update physician:", e);
    return Response.json({ e: "Unable to update physician." }, { status: 500 });
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

    if (result.deletedCount === 0) {
      return Response.json({ e: "Physician not found." }, { status: 404 });
    }

    return Response.json({ id });
  } catch (e) {
    console.error("Unable to delete physician:", e);
    return Response.json({ e: "Unable to delete physician." }, { status: 500 });
  }
}