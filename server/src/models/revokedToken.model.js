
import mongoose from "mongoose";

const revokedTokenSchema = new mongoose.Schema(
    {
        tokenIdHash: {
            type: String,
            required: true,
            unique: true,
        },

        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        collection: "revoked_tokens",
        timestamps: true,
    }
);

/*
 * Automatically delete expired revocation records
 */
revokedTokenSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

const RevokedToken = mongoose.model(
    "RevokedToken",
    revokedTokenSchema
);

export default RevokedToken;
