import { z } from "zod";

const objectIdSchema = z.string().regex(
    /^[a-fA-F0-9]{24}$/,
    "Invalid MongoDB ObjectId"
);

export const createAllocationSchema = z.strictObject({
    studentId: objectIdSchema,
    hostelId: objectIdSchema,
    roomId: objectIdSchema,
    bedId: objectIdSchema,
});

export const listAllocationsQuerySchema = z.strictObject({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(["active", "vacated"]).optional(),
    hostelId: objectIdSchema.optional(),
    studentId: objectIdSchema.optional(),
});

export const listVacanciesQuerySchema = z.strictObject({
    hostelId: objectIdSchema.optional(),
});
