import mongoose from "mongoose";

const { Schema } = mongoose;

const complaintSchema = new Schema(
    {
        student: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Student reference is required"],
            immutable: true,
        },

        hostel: {
            type: Schema.Types.ObjectId,
            ref: "Hostel",
            required: [true, "Hostel reference is required"],
        },

        room: {
            type: Schema.Types.ObjectId,
            ref: "Room",
            default: null,
        },

        bed: {
            type: Schema.Types.ObjectId,
            ref: "Bed",
            default: null,
        },

        title: {
            type: String,
            required: [true, "Complaint title is required"],
            trim: true,
            minlength: [3, "Title must be at least 3 characters"],
            maxlength: [120, "Title cannot exceed 120 characters"],
        },

        description: {
            type: String,
            required: [true, "Complaint description is required"],
            trim: true,
            minlength: [10, "Description must be at least 10 characters"],
            maxlength: [2000, "Description cannot exceed 2000 characters"],
        },

        category: {
            type: String,
            required: [true, "Complaint category is required"],
            enum: [
                "electrical",
                "plumbing",
                "carpentry",
                "cleaning",
                "internet",
                "furniture",
                "other",
            ],
            index: true,
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
            index: true,
        },

        status: {
            type: String,
            enum: [
                "pending",
                "assigned",
                "in_progress",
                "resolved",
                "rejected",
            ],
            default: "pending",
            index: true,
        },

        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },

        assignedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        assignedAt: {
            type: Date,
            default: null,
        },

        resolutionNotes: {
            type: String,
            default: null,
            trim: true,
            maxlength: [2000, "Resolution notes cannot exceed 2000 characters"],
        },

        resolvedAt: {
            type: Date,
            default: null,
        },

        resolvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
        collection: "complaints",
    }
);

complaintSchema.index({ student: 1, status: 1 });
complaintSchema.index({ hostel: 1, status: 1 });
complaintSchema.index({ assignedTo: 1, status: 1 });
complaintSchema.index({ createdAt: -1 });

complaintSchema.methods.toSafeObject = function () {
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
        title: this.title,
        description: this.description,
        category: this.category,
        priority: this.priority,
        status: this.status,
        assignedTo: stringifyId(this.assignedTo),
        assignedBy: stringifyId(this.assignedBy),
        assignedAt: this.assignedAt,
        resolutionNotes: this.resolutionNotes,
        resolvedAt: this.resolvedAt,
        resolvedBy: stringifyId(this.resolvedBy),
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;
