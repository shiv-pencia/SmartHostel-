import mongoose from "mongoose";

const { Schema } = mongoose;

const visitorSchema = new Schema(
    {
        visitorName: {
            type: String,
            required: [true, "Visitor name is required"],
            trim: true,
            maxlength: [100, "Name cannot exceed 100 characters"],
        },
        visitorPhone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
            maxlength: [20, "Phone number is too long"],
        },
        student: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Student reference is required"],
            index: true,
        },
        hostel: {
            type: Schema.Types.ObjectId,
            ref: "Hostel",
            required: [true, "Hostel reference is required"],
            index: true,
        },
        purpose: {
            type: String,
            required: [true, "Purpose of visit is required"],
            trim: true,
            maxlength: [200, "Purpose cannot exceed 200 characters"],
        },
        idProofType: {
            type: String,
            enum: ["Aadhaar", "Govt ID", "College ID", "Driving License", "Passport", "Other"],
            default: "College ID",
        },
        checkIn: {
            type: Date,
            default: Date.now,
        },
        checkOut: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ["inside", "checked_out"],
            default: "inside",
            index: true,
        },
        recordedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Staff / warden reference is required"],
        },
    },
    {
        timestamps: true,
        collection: "visitors",
    }
);

visitorSchema.methods.toSafeObject = function () {
    return {
        id: this._id.toString(),
        visitorName: this.visitorName,
        visitorPhone: this.visitorPhone,
        student: this.student,
        hostel: this.hostel,
        purpose: this.purpose,
        idProofType: this.idProofType,
        checkIn: this.checkIn,
        checkOut: this.checkOut,
        status: this.status,
        recordedBy: this.recordedBy,
        createdAt: this.createdAt,
    };
};

const Visitor = mongoose.model("Visitor", visitorSchema);

export default Visitor;
