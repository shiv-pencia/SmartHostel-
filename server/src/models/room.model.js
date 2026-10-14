
import mongoose from "mongoose";

const { Schema } = mongoose;

const roomSchema = new Schema(
  {
    hostel: {
      type: Schema.Types.ObjectId,
      ref: "Hostel",
      required: [true, "Hostel reference is required"],
      immutable: true,
    },

    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
      trim: true,
      uppercase: true,
      maxlength: [20, "Room number is too long"],
      match: [
        /^[A-Z0-9][A-Z0-9-]*$/,
        "Invalid room number format",
      ],
    },

    floor: {
      type: Number,
      required: [true, "Floor is required"],
      min: [0, "Floor cannot be negative"],
      max: [100, "Floor exceeds allowed range"],
      validate: {
        validator: Number.isInteger,
        message: "Floor must be an integer",
      },
    },

    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
      max: [20, "Capacity cannot exceed 20"],
      validate: {
        validator: Number.isInteger,
        message: "Capacity must be an integer",
      },
    },

    // Maintained by bed.service.js, not client requests.
    bedCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 20,
      validate: {
        validator: Number.isInteger,
        message: "Bed count must be an integer",
      },
    },

    roomType: {
      type: String,
      enum: ["standard", "accessible"],
      default: "standard",
    },

    status: {
      type: String,
      enum: ["active", "maintenance", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
    collection: "rooms",
  }
);

roomSchema.index(
  { hostel: 1, roomNumber: 1 },
  { unique: true }
);

roomSchema.index({
  hostel: 1,
  status: 1,
});

roomSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    hostel: this.hostel.toString(),
    roomNumber: this.roomNumber,
    floor: this.floor,
    capacity: this.capacity,
    bedCount: this.bedCount,
    unprovisionedSlots: this.capacity - this.bedCount,
    roomType: this.roomType,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Room = mongoose.model("Room", roomSchema);

export default Room;
