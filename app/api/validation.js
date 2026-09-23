import { z } from "zod";

const providerFields = {
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/).max(180),
  name: z.string().trim().min(1).max(120),
  position: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(1).max(40),
  imageUrl: z.string().max(7_000_000),
  location: z.string().trim().max(200),
  about: z.string().trim().max(2000)
};

export const providerSchema = z.object(providerFields).strict();
export const userProfileSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/).max(180),
  name: z.string().trim().min(1).max(120),
  position: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(1).max(40),
  imageUrl: z.string().max(7_000_000),
  location: z.string().trim().max(200),
  about: z.string().trim().max(2000),
  profileType: z.enum(["Staff", "Physician", "Specialist"])
}).strict();

export const guideSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000),
  fileName: z.string().trim().min(1).max(255),
  fileData: z.string().max(14_000_000).startsWith("data:application/pdf;base64,")
}).strict();

export function parseBody(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Validation failed:", result.error.issues);
    }
    return { error: "The submitted information is invalid." };
  }

  return { data: result.data };
}

