
import { z } from "zod";

const bedNumberSchema = z
    .string()
    .trim()
    .toUpperCase()
    .min(1)
    .max(15)
    .regex(
        /^[A-Z0-9][A-Z0-9-]*$/,
        "Invalid bed number"
    );

const operationalStatusSchema = z.enum([
    "usable",
    "maintenance",
    "inactive",
]);

export const createBedSchema = z.strictObject({
    bedNumber: bedNumberSchema,
});

export const updateBedSchema = z.strictObject({
    bedNumber: bedNumberSchema,
});

export const updateBedStatusSchema = z.strictObject({
    operationalStatus: operationalStatusSchema,
});
