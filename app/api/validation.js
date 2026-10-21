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
  folder: z.string().trim().min(1).max(100).optional(),
  partnerViewable: z.boolean().optional(),
  type: z.enum(["file", "video"]).default("file"),
  checklist: z.array(z.string().trim().min(1).max(300)).max(50).optional(),
  fileName: z.string().trim().min(1).max(255).optional(),
  fileData: z.string().max(14_000_000).startsWith("data:application/pdf;base64,").optional(),
  videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/).optional()
}).strict().superRefine((guide, context) => {
  if (guide.type === "file" && (!guide.fileName || !guide.fileData)) {
    context.addIssue({
      code: "custom",
      message: "A PDF file is required.",
      path: ["fileData"]
    });
  }

  if (guide.type === "video" && !guide.videoId) {
    context.addIssue({
      code: "custom",
      message: "A YouTube video URL is required.",
      path: ["videoId"]
    });
  }
});

export const guideFolderSchema = z.object({
  folder: z.string().trim().min(1).max(100),
  partnerViewable: z.boolean()
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
