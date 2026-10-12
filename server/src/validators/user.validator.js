
import { z } from "zod";

/*
 * User roles used in our system
 */

const userRoleSchema = z.enum([
    "student",
    "warden",
    "staff",
    "admin",
]);

/*
 * GET /users query parameters
 */

export const listUsersQuerySchema = z.strictObject({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int()
        .min(1)
        .max(100)
        .default(10),

    search: z.string().trim()
        .max(100)
        .optional(),

    role: userRoleSchema.optional(),

    status: z.enum([
        "active",
        "inactive",
    ]).optional(),
});

/*
 * Update basic user information
 *
 * Sensitive fields are intentionally excluded.
 */

export const updateUserSchema = z.strictObject({
    name: z.string().trim()
        .min(2)
        .max(100)
        .optional(),

    phone: z.union([
        z.string().trim()
            .regex(/^\+?[0-9]{10,15}$/),
        z.null(),
    ]).optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    {
        message: "Provide at least one field to update",
    }
);

/*
 * Activate or deactivate user
 */

export const updateUserStatusSchema = z.strictObject({
    isActive: z.boolean(),
});

/*
 * Change user role
 */

export const updateUserRoleSchema = z.strictObject({
    role: userRoleSchema,
});
