import { z } from "zod";

const objectIdSchema = z.string().regex(
    /^[a-fA-F0-9]{24}$/,
    "Invalid MongoDB ObjectId"
);

export const createVisitorSchema = z.strictObject({
    visitorName: z.string().trim().min(2).max(100),
    visitorPhone: z.string().trim().min(5).max(20),
    studentId: objectIdSchema,
    hostelId: objectIdSchema,
    purpose: z.string().trim().min(3).max(200),
    idProofType: z.enum(["Aadhaar", "Govt ID", "College ID", "Driving License", "Passport", "Other"]).optional().default("College ID"),
});
