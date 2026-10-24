import { z } from "zod";

const objectIdSchema = z.string().regex(
    /^[a-fA-F0-9]{24}$/,
    "Invalid MongoDB ObjectId"
);

export const createNoticeSchema = z.strictObject({
    title: z.string().trim().min(3).max(150),
    content: z.string().trim().min(5).max(3000),
    category: z.enum([
        "general",
        "mess",
        "maintenance",
        "event",
        "curfew",
        "urgent",
    ]).optional().default("general"),
    priority: z.enum(["normal", "important", "urgent"]).optional().default("normal"),
    targetHostel: objectIdSchema.nullable().optional(),
});
