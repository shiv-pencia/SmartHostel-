
import mongoose from "mongoose";

const { Schema } = mongoose;

const allocationSchema = new Schema(
    {
        /*
         * STUDENT
         * Must reference a User with role "student".
         * The role is checked in the service layer.
         */
        student: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Student is required"],
            immutable: true,
        },

        /*
         * PHYSICAL ACCOMMODATION
         */
        hostel: {
            type: Schema.Types.ObjectId,
            ref: "Hostel",
            required: [true, "Hostel is required"],
            immutable: true,
        },

        room: {
            type: Schema.Types.ObjectId,
            ref: "Room",
            required: [true, "Room is required"],
            immutable: true,
        },

        bed: {
            type: Schema.Types.ObjectId,
            ref: "Bed",
            required: [true, "Bed is required"],
            immutable: true,
        },

        /*
         * ALLOCATION LIFECYCLE
         */
        status: {
            type: String,
            enum: ["active", "vacated"],
            default: "active",
            required: true,
        },

        allocatedAt: {
            type: Date,
            default: Date.now,
            required: true,
            immutable: true,
        },

        vacatedAt: {
            type: Date,
            default: null,
        },

        /*
         * AUDIT INFORMATION
         */
        allocatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [
                true,
                "Allocating administrator is required",
            ],
            immutable: true,
        },

        vacatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
        collection: "allocations",
    }
);

/*
 * BUSINESS-STATE VALIDATION
 *
 * Active allocations cannot have vacation details.
 * Vacated allocations must have vacation details.
 */
allocationSchema.pre("validate", function () {
    if (this.status === "active") {
        if (this.vacatedAt != null) {
            this.invalidate(
                "vacatedAt",
                "An active allocation cannot have a vacation date"
            );
        }

        if (this.vacatedBy != null) {
            this.invalidate(
                "vacatedBy",
                "An active allocation cannot have a vacating administrator"
            );
        }
    }

    if (this.status === "vacated") {
        if (this.vacatedAt == null) {
            this.invalidate(
                "vacatedAt",
                "Vacation date is required for a vacated allocation"
            );
        }

        if (this.vacatedBy == null) {
            this.invalidate(
                "vacatedBy",
                "Vacating administrator is required"
            );
        }
    }

    if (
        this.allocatedAt &&
        this.vacatedAt &&
        this.vacatedAt < this.allocatedAt
    ) {
        this.invalidate(
            "vacatedAt",
            "Vacation date cannot be before allocation date"
        );
    }
});

/*
 * UNIQUE INDEX 1
 *
 * A student can have only one ACTIVE allocation.
 *
 * Multiple VACATED records for the same student
 * are permitted.
 */
allocationSchema.index(
    { student: 1 },
    {
        unique: true,
        name: "unique_active_allocation_per_student",
        partialFilterExpression: {
            status: "active",
        },
    }
);

/*
 * UNIQUE INDEX 2
 *
 * A bed can have only one ACTIVE allocation.
 *
 * Historical VACATED records are permitted.
 */
allocationSchema.index(
    { bed: 1 },
    {
        unique: true,
        name: "unique_active_allocation_per_bed",
        partialFilterExpression: {
            status: "active",
        },
    }
);

/*
 * HISTORY QUERY INDEXES
 */
allocationSchema.index({
    student: 1,
    allocatedAt: -1,
});

allocationSchema.index({
    bed: 1,
    allocatedAt: -1,
});

/*
 * SUPPORT HOSTEL / ROOM OCCUPANCY QUERIES
 */
allocationSchema.index({
    hostel: 1,
    status: 1,
});

allocationSchema.index({
    room: 1,
    status: 1,
});

/*
 * SAFE API RESPONSE
 */
allocationSchema.methods.toSafeObject = function () {
    const stringifyId = (val) => {
        if (!val) return null;
        if (val._id) return val._id.toString();
        return val.toString();
    };

    return {
        id: this._id.toString(),
        student: stringifyId(this.student),
        hostel: stringifyId(this.hostel),
        room: stringifyId(this.room),
        bed: stringifyId(this.bed),
        status: this.status,
        allocatedAt: this.allocatedAt,
        vacatedAt: this.vacatedAt,
        allocatedBy: stringifyId(this.allocatedBy),
        vacatedBy: stringifyId(this.vacatedBy),
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

const Allocation = mongoose.model(
    "Allocation",
    allocationSchema
);

export default Allocation;
