import mongoose from "mongoose";

const { Schema } = mongoose;

const noticeSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Notice title is required"],
            trim: true,
            maxlength: [150, "Title cannot exceed 150 characters"],
        },
        content: {
            type: String,
            required: [true, "Notice content is required"],
            trim: true,
            maxlength: [3000, "Content cannot exceed 3000 characters"],
        },
        category: {
            type: String,
            enum: [
                "general",
                "mess",
                "maintenance",
                "event",
                "curfew",
                "urgent",
            ],
            default: "general",
            index: true,
        },
        priority: {
            type: String,
            enum: ["normal", "important", "urgent"],
            default: "normal",
            index: true,
        },
        targetHostel: {
            type: Schema.Types.ObjectId,
            ref: "Hostel",
            default: null,
            index: true,
        },
        publishedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Author reference is required"],
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
        collection: "notices",
    }
);

noticeSchema.methods.toSafeObject = function () {
    return {
        id: this._id.toString(),
        title: this.title,
        content: this.content,
        category: this.category,
        priority: this.priority,
        targetHostel: this.targetHostel,
        publishedBy: this.publishedBy,
        isActive: this.isActive,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

const Notice = mongoose.model("Notice", noticeSchema);

export default Notice;
