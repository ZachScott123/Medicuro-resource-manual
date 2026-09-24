export function isEditorEmail(email) {
  if (!email) return false;
  return getEditorEmails().includes(String(email).trim().toLowerCase());
}

export function isAuthorizedEmail(email) {
  if (!email) return false;
  return getAuthorizedEmails().includes(String(email).trim().toLowerCase());
}

export function isPhysicianSpecialistEmail(email) {
  if (!email) return false;
  return getPhysicianSpecialistEmails().includes(String(email).trim().toLowerCase());
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

    if (
      !email ||
      (!isAuthorizedEmail(email) && !isPhysicianSpecialistEmail(email))
    ) {
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


export async function getPhysicianSpecialistUser({ requireEditor = false } = {}) {
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

    if (!email || !isPhysicianSpecialistEmail(email)) {
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
