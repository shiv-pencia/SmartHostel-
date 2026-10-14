
import { z } from "zod";

const objectIdSchema = z.string().regex(
    /^[a-fA-F0-9]{24}$/,
    "Invalid MongoDB ObjectId"
);

const roomNumberSchema = z
    .string()
    .trim()
    .toUpperCase()
    .min(1)
    .max(20)
    .regex(/^[A-Z0-9][A-Z0-9-]*$/);

const floorSchema = z.number()
    .int()
    .min(0)
    .max(100);

const capacitySchema = z.number()
    .int()
    .min(1)
    .max(20);

const roomTypeSchema = z.enum([
    "standard",
    "accessible",
]);

const roomStatusSchema = z.enum([
    "active",
    "maintenance",
    "inactive",
]);

export const createRoomSchema = z.strictObject({
    hostel: objectIdSchema,
    roomNumber: roomNumberSchema,
    floor: floorSchema,
    capacity: capacitySchema,
    roomType: roomTypeSchema.default("standard"),
});

export const updateRoomSchema = z
    .strictObject({
        roomNumber: roomNumberSchema.optional(),
        floor: floorSchema.optional(),
        capacity: capacitySchema.optional(),
        roomType: roomTypeSchema.optional(),
    })
    .refine(
        (data) => Object.keys(data).length > 0,
        "Provide at least one field to update"
    );

export const updateRoomStatusSchema = z.strictObject({
    status: roomStatusSchema,
});

export const listRoomsQuerySchema = z.strictObject({
    page: z.coerce.number().int()
        .min(1).max(100000).default(1),

    limit: z.coerce.number().int()
        .min(1).max(100).default(10),

    hostel: objectIdSchema.optional(),

    search: z.string().trim()
        .max(100).optional(),

    status: roomStatusSchema.optional(),

    roomType: roomTypeSchema.optional(),
});
