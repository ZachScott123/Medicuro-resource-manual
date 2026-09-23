import { jwtVerify } from "jose";
import { cookies } from "next/headers";

function getAuthorizedEmails() {
  return (process.env.AUTHORIZED_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function getEditorEmails() {
  return (process.env.EDITOR_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isEditorEmail(email) {
  if (!email) return false;
  return getEditorEmails().includes(String(email).trim().toLowerCase());
}

export async function getAuthenticatedUser({ requireEditor = false } = {}) {
  const token = (await cookies()).get("session")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    const email = payload.email?.toLowerCase();

    if (!email || !getAuthorizedEmails().includes(email)) {
      return null;
    }

    if (requireEditor && !getEditorEmails().includes(email)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}