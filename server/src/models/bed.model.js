
import mongoose from "mongoose";

const { Schema } = mongoose;

const bedSchema = new Schema(
    {
        room: {
            type: Schema.Types.ObjectId,
            ref: "Room",
            required: [true, "Room reference is required"],
            immutable: true,
        },

        bedNumber: {
            type: String,
            required: [true, "Bed number is required"],
            trim: true,
            uppercase: true,
            minlength: [1, "Bed number is required"],
            maxlength: [15, "Bed number is too long"],
            match: [
                /^[A-Z0-9][A-Z0-9-]*$/,
                "Invalid bed number format",
            ],
        },

        operationalStatus: {
            type: String,
            enum: [
                "usable",
                "maintenance",
                "inactive",
            ],
            default: "usable",
        },
    },
    {
        timestamps: true,
        collection: "beds",
    }
);

/*
 * Unique bed number within a room
 */
bedSchema.index(
    {
        room: 1,
        bedNumber: 1,
    },
    {
        unique: true,
    }
);

/*
 * Support room-wise operational queries
 */
bedSchema.index({
    room: 1,
    operationalStatus: 1,
});

/*
 * Safe API response
 */
bedSchema.methods.toSafeObject = function () {
    return {
        id: this._id.toString(),
        room: this.room.toString(),
        bedNumber: this.bedNumber,
        operationalStatus: this.operationalStatus,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

const Bed = mongoose.model(
    "Bed",
    bedSchema
);

export default Bed;
