import { z } from "zod";

const objectIdSchema = z.string().regex(
    /^[a-fA-F0-9]{24}$/,
    "Invalid MongoDB ObjectId"
);

const categoryEnum = z.enum([
    "electrical",
    "plumbing",
    "carpentry",
    "cleaning",
    "internet",
    "furniture",
    "other",
]);

const priorityEnum = z.enum(["low", "medium", "high", "urgent"]);

const statusEnum = z.enum([
    "pending",
    "assigned",
    "in_progress",
    "resolved",
    "rejected",
]);

export const createComplaintSchema = z.strictObject({
    title: z
        .string()
        .trim()
        .min(3, "Title must be at least 3 characters")
        .max(120, "Title cannot exceed 120 characters"),
    description: z
        .string()
        .trim()
        .min(10, "Description must be at least 10 characters")
        .max(2000, "Description cannot exceed 2000 characters"),
    category: categoryEnum,
    priority: priorityEnum.optional().default("medium"),
    hostelId: objectIdSchema.optional(),
    roomId: objectIdSchema.optional(),
    bedId: objectIdSchema.optional(),
});

export const assignComplaintSchema = z.strictObject({
    staffId: objectIdSchema,
    notes: z.string().trim().max(1000).optional(),
});

export const updateComplaintStatusSchema = z.strictObject({
    status: z.enum(["pending", "in_progress", "resolved", "rejected"]),
    resolutionNotes: z.string().trim().max(2000).optional(),
});

export const listComplaintsQuerySchema = z.strictObject({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: statusEnum.optional(),
    category: categoryEnum.optional(),
    priority: priorityEnum.optional(),
    hostelId: objectIdSchema.optional(),
    studentId: objectIdSchema.optional(),
    assignedTo: objectIdSchema.optional(),
});
