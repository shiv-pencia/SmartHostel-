
import { z } from "zod";

/*
 * Reusable field validators
 */

const hostelNameSchema = z
    .string()
    .trim()
    .min(2, "Hostel name must have at least 2 characters")
    .max(120, "Hostel name cannot exceed 120 characters");

const hostelCodeSchema = z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "Hostel code must have at least 2 characters")
    .max(20, "Hostel code cannot exceed 20 characters")
    .regex(
        /^[A-Z0-9][A-Z0-9-]*$/,
        "Code can contain letters, numbers and hyphens only"
    );

const locationSchema = z
    .string()
    .trim()
    .min(3, "Location must have at least 3 characters")
    .max(200, "Location cannot exceed 200 characters");

const genderPolicySchema = z.enum([
    "male",
    "female",
    "coed",
]);

const objectIdSchema = z
    .string()
    .regex(
        /^[a-fA-F0-9]{24}$/,
        "Invalid MongoDB ObjectId"
    );

const wardenSchema = objectIdSchema.nullable();

/*
 * CREATE HOSTEL
 * POST /api/v1/hostels
 */

export const createHostelSchema = z.strictObject({
    name: hostelNameSchema,
    code: hostelCodeSchema,
    location: locationSchema,

    genderPolicy: genderPolicySchema.default("coed"),

    warden: wardenSchema.optional(),
});

/*
 * UPDATE HOSTEL
 * PATCH /api/v1/hostels/:hostelId
 */

export const updateHostelSchema = z
    .strictObject({
        name: hostelNameSchema.optional(),

        location: locationSchema.optional(),

        genderPolicy: genderPolicySchema.optional(),

        warden: wardenSchema.optional(),
    })
    .refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "Provide at least one field to update",
        }
    );

/*
 * ACTIVATE / DEACTIVATE HOSTEL
 * PATCH /api/v1/hostels/:hostelId/status
 */

export const updateHostelStatusSchema = z.strictObject({
    isActive: z.boolean(),
});

/*
 * LIST HOSTELS
 * GET /api/v1/hostels
 */

export const listHostelsQuerySchema = z.strictObject({
    page: z.coerce.number()
        .int()
        .min(1)
        .max(100000)
        .default(1),

    limit: z.coerce.number()
        .int()
        .min(1)
        .max(100)
        .default(10),

    search: z.string()
        .trim()
        .max(100)
        .optional(),

    genderPolicy: genderPolicySchema.optional(),

    status: z.enum([
        "active",
        "inactive",
    ]).optional(),
});

/*
 * HOSTEL ID PARAMETER
 */

export const hostelIdParamSchema = z.strictObject({
    hostelId: objectIdSchema,
});
