import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { connectToAuthDB } from "@/app/api/databases/db";

const emailCollation = { locale: "en", strength: 2 };

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

async function hasEmail(collection, email) {
  return Boolean(
    await collection.findOne(
      { email },
      { projection: { _id: 1 }, collation: emailCollation }
    )
  );
}

export async function getEmailAccess(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { isEditor: false, isAuthorized: false, isPhysicianSpecialist: false };
  }

  const { db } = await connectToAuthDB();
  const [isEditor, isAuthorized, isPhysicianSpecialist] = await Promise.all([
    hasEmail(db.collection("administrators"), normalizedEmail),
    hasEmail(db.collection("authenticated_staff"), normalizedEmail),
    hasEmail(db.collection("authenticated_partners"), normalizedEmail)
  ]);

  return { isEditor, isAuthorized, isPhysicianSpecialist };
}

export async function isEditorEmail(email) {
  return (await getEmailAccess(email)).isEditor;
}

export async function isAuthorizedEmail(email) {
  return (await getEmailAccess(email)).isAuthorized;
}

export async function isPhysicianSpecialistEmail(email) {
  return (await getEmailAccess(email)).isPhysicianSpecialist;
}

export async function getAuthenticatedUser({ requireEditor = false } = {}) {
  const token = (await cookies()).get("session")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return null;
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(token, new TextEncoder().encode(secret)));
  } catch {
    return null;
  }

  const email = normalizeEmail(payload.email);
  if (!email) {
    return null;
  }

  const access = await getEmailAccess(email);
  if (
    (!access.isAuthorized && !access.isPhysicianSpecialist && !access.isEditor) ||
    (requireEditor && !access.isEditor)
  ) {
    return null;
  }

  return { ...payload, email, ...access };
}

export async function getPhysicianSpecialistUser({ requireEditor = false } = {}) {
  const token = (await cookies()).get("session")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return null;
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(token, new TextEncoder().encode(secret)));
  } catch {
    return null;
  }

  const email = normalizeEmail(payload.email);
  if (!email) {
    return null;
  }

  const access = await getEmailAccess(email);
  if (!access.isPhysicianSpecialist || (requireEditor && !access.isEditor)) {
    return null;
  }

  return { ...payload, email };
}
