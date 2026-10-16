import { connectToDB } from "@/app/api/databases/guides-db";
import { getAuthenticatedUser } from "@/app/lib/auth-session";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  const user = await getAuthenticatedUser();

  if (!user || (!user.isAuthorized && !user.isPhysicianSpecialist)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { db } = await connectToDB();
    const guideQuery = ObjectId.isValid(id)
      ? { $or: [{ id }, { _id: new ObjectId(id) }] }
      : { id };
    const guide = await db.collection("guides").findOne(guideQuery);

    if (!guide || (user.isPhysicianSpecialist && !user.isAuthorized && !user.isEditor && guide.partnerViewable !== true)) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const match = /^data:application\/pdf;base64,([A-Za-z0-9+/]+={0,2})$/.exec(guide.fileData || "");
    if (!match) {
      return Response.json({ error: "Invalid PDF data" }, { status: 500 });
    }

    const disposition = new URL(request.url).searchParams.get("download") === "1"
      ? "attachment"
      : "inline";

    return new Response(Buffer.from(match[1], "base64"), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(guide.fileName || "guide.pdf")}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    console.error("Unable to load guide PDF:", error);
    return Response.json({ error: "Unable to load guide PDF" }, { status: 500 });
  }
}
