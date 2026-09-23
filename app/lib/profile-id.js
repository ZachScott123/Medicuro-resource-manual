// ex. "zachary-scott-8293183812".
export function buildProfileIdFromEmail(email) {
  const localPart = String(email || "")
    .trim()
    .toLowerCase()
    .split("@")[0];

  const slug = localPart.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "user";
  const suffix = Date.now();

  return `${slug}-${suffix}`;
}
