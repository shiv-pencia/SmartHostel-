
import mongoose from "mongoose";

const { Schema } = mongoose;

const hostelSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Hostel name is required"],
            trim: true,
            minlength: [2, "Hostel name is too short"],
            maxlength: [120, "Hostel name is too long"],
        },

        code: {
            type: String,
            required: [true, "Hostel code is required"],
            trim: true,
            uppercase: true,
            minlength: [2, "Hostel code is too short"],
            maxlength: [20, "Hostel code is too long"],
            match: [
                /^[A-Z0-9][A-Z0-9-]*$/,
                "Hostel code can contain uppercase letters, numbers and hyphens",
            ],
        },

        location: {
            type: String,
            required: [true, "Location is required"],
            trim: true,
            minlength: [3, "Location is too short"],
            maxlength: [200, "Location is too long"],
        },

        genderPolicy: {
            type: String,
            enum: ["male", "female", "coed"],
            default: "coed",
        },

        warden: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        collection: "hostels",
    }
);

/*
 * Indexes
 */

// Every hostel must have a unique code.
hostelSchema.index(
    { code: 1 },
    { unique: true }
);

// Helps queries filtering active hostels.
hostelSchema.index({
    isActive: 1,
    name: 1,
});

/*
 * Safe API response
 */
hostelSchema.methods.toSafeObject = function () {
    return {
        id: this._id.toString(),
        name: this.name,
        code: this.code,
        location: this.location,
        genderPolicy: this.genderPolicy,
        warden: this.warden
            ? this.warden.toString()
            : null,
        isActive: this.isActive,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

const Hostel = mongoose.model(
    "Hostel",
    hostelSchema
);

export default Hostel;
