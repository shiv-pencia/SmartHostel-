import mongoose from "mongoose";
import env from "./config/env.js";
import User from "./models/user.model.js";
import Hostel from "./models/hostel.model.js";
import Room from "./models/room.model.js";
import Bed from "./models/bed.model.js";
import Allocation from "./models/allocation.model.js";
import Complaint from "./models/complaint.model.js";
import Notice from "./models/notice.model.js";
import Visitor from "./models/visitor.model.js";
import { iitgHostelsData } from "./seedIITGHostels.js";

async function seedDatabase() {
    console.log("🌱 Connecting to MongoDB for database seeding...");
    await mongoose.connect(env.mongodbUri);
    console.log(" Connected to MongoDB:", env.mongodbUri);

    console.log("🧹 Clearing previous demo data...");
    await Promise.all([
        User.deleteMany({}),
        Hostel.deleteMany({}),
        Room.deleteMany({}),
        Bed.deleteMany({}),
        Allocation.deleteMany({}),
        Complaint.deleteMany({}),
        Notice.deleteMany({}),
        Visitor.deleteMany({}),
    ]);

    console.log("👥 Creating users across all system roles...");
    const [admin, warden, staffElectrician, staffPlumber, student1, student2, student3] =
        await Promise.all([
            User.create({
                name: "System Administrator",
                email: "admin@example.com",
                password: "AdminPass@123",
                role: "admin",
                phone: "9876543210",
                isActive: true,
            }),
            User.create({
                name: "Dr. Suresh Verma (Warden)",
                email: "warden@example.com",
                password: "WardenPass@123",
                role: "warden",
                phone: "9876543211",
                isActive: true,
            }),
            User.create({
                name: "Ramesh Sharma (Electrician)",
                email: "staff@example.com",
                password: "StaffPass@123",
                role: "staff",
                phone: "9876543212",
                isActive: true,
            }),
            User.create({
                name: "Manoj Kumar (Plumber)",
                email: "plumber@example.com",
                password: "StaffPass@123",
                role: "staff",
                phone: "9876543213",
                isActive: true,
            }),
            User.create({
                name: "Rahul Sharma",
                email: "student@example.com",
                password: "StudentPass@123",
                role: "student",
                phone: "9876543214",
                isActive: true,
            }),
            User.create({
                name: "Pooja Patel",
                email: "pooja@example.com",
                password: "StudentPass@123",
                role: "student",
                phone: "9876543215",
                isActive: true,
            }),
            User.create({
                name: "Amit Singhania",
                email: "amit@example.com",
                password: "StudentPass@123",
                role: "student",
                phone: "9876543216",
                isActive: true,
            }),
        ]);

    console.log("🏢 Creating all 14 IIT Guwahati Hostels...");
    const hostelMap = new Map();

    for (const hData of iitgHostelsData) {
        const hostel = await Hostel.create({
            name: hData.name,
            code: hData.code,
            location: hData.location,
            genderPolicy: hData.genderPolicy,
            isActive: true,
        });
        hostelMap.set(hData.code, hostel);
    }

    const brahmaputra = hostelMap.get("BRH");
    const disang = hostelMap.get("DIS");
    const kapili = hostelMap.get("KAP");

    console.log("🚪 Creating Rooms & Beds...");
    // Brahmaputra Rooms
    const brhRoom101 = await Room.create({
        hostel: brahmaputra._id,
        roomNumber: "101",
        floor: 1,
        capacity: 2,
        bedCount: 2,
        roomType: "standard",
        status: "active",
    });
    const brhBed101A = await Bed.create({ room: brhRoom101._id, bedNumber: "101-A", operationalStatus: "usable" });
    const brhBed101B = await Bed.create({ room: brhRoom101._id, bedNumber: "101-B", operationalStatus: "usable" });

    const brhRoom102 = await Room.create({
        hostel: brahmaputra._id,
        roomNumber: "102",
        floor: 1,
        capacity: 2,
        bedCount: 2,
        roomType: "standard",
        status: "active",
    });
    const brhBed102A = await Bed.create({ room: brhRoom102._id, bedNumber: "102-A", operationalStatus: "usable" });
    const brhBed102B = await Bed.create({ room: brhRoom102._id, bedNumber: "102-B", operationalStatus: "usable" });

    const brhRoom201 = await Room.create({
        hostel: brahmaputra._id,
        roomNumber: "201",
        floor: 2,
        capacity: 1,
        bedCount: 1,
        roomType: "standard",
        status: "active",
    });
    const brhBed201A = await Bed.create({ room: brhRoom201._id, bedNumber: "201-A", operationalStatus: "usable" });

    // Disang Rooms
    const disRoom101 = await Room.create({
        hostel: disang._id,
        roomNumber: "101",
        floor: 1,
        capacity: 2,
        bedCount: 2,
        roomType: "standard",
        status: "active",
    });
    const disBed101A = await Bed.create({ room: disRoom101._id, bedNumber: "101-A", operationalStatus: "usable" });
    const disBed101B = await Bed.create({ room: disRoom101._id, bedNumber: "101-B", operationalStatus: "usable" });

    // Kapili Dormitory Room
    const kapRoom101 = await Room.create({
        hostel: kapili._id,
        roomNumber: "101",
        floor: 1,
        capacity: 3,
        bedCount: 3,
        roomType: "standard",
        status: "active",
    });
    await Bed.create({ room: kapRoom101._id, bedNumber: "101-A", operationalStatus: "usable" });
    await Bed.create({ room: kapRoom101._id, bedNumber: "101-B", operationalStatus: "maintenance" });
    await Bed.create({ room: kapRoom101._id, bedNumber: "101-C", operationalStatus: "usable" });

    console.log("🛏️ Creating Active Allocations...");
    await Promise.all([
        Allocation.create({
            student: student1._id,
            hostel: brahmaputra._id,
            room: brhRoom101._id,
            bed: brhBed101A._id,
            status: "active",
            allocatedBy: admin._id,
        }),
        Allocation.create({
            student: student2._id,
            hostel: disang._id,
            room: disRoom101._id,
            bed: disBed101A._id,
            status: "active",
            allocatedBy: admin._id,
        }),
        Allocation.create({
            student: student3._id,
            hostel: brahmaputra._id,
            room: brhRoom102._id,
            bed: brhBed102A._id,
            status: "active",
            allocatedBy: admin._id,
        }),
    ]);

    console.log("🛠️ Creating Grievance Complaints...");
    await Promise.all([
        Complaint.create({
            student: student1._id,
            hostel: brahmaputra._id,
            room: brhRoom101._id,
            bed: brhBed101A._id,
            title: "Ceiling fan making squeaking noise",
            description: "The ceiling fan motor in room 101 makes high-pitched noise when set to speed 3 and above.",
            category: "electrical",
            priority: "medium",
            status: "in_progress",
            assignedTo: staffElectrician._id,
            assignedBy: admin._id,
            assignedAt: new Date(Date.now() - 3600000 * 5),
        }),
        Complaint.create({
            student: student1._id,
            hostel: brahmaputra._id,
            room: brhRoom101._id,
            bed: brhBed101A._id,
            title: "Washbasin tap leaking continuously",
            description: "Cold water tap has worn out gasket causing water dripping 24 hours.",
            category: "plumbing",
            priority: "urgent",
            status: "pending",
        }),
        Complaint.create({
            student: student2._id,
            hostel: disang._id,
            room: disRoom101._id,
            bed: disBed101A._id,
            title: "Study chair wheel broken",
            description: "One caster wheel detached from student desk chair.",
            category: "furniture",
            priority: "low",
            status: "resolved",
            assignedTo: staffPlumber._id,
            assignedBy: admin._id,
            assignedAt: new Date(Date.now() - 3600000 * 24),
            resolvedAt: new Date(Date.now() - 3600000 * 12),
            resolutionNotes: "Replaced defective chair with inspected standard wooden study chair.",
        }),
        Complaint.create({
            student: student3._id,
            hostel: brahmaputra._id,
            room: brhRoom102._id,
            bed: brhBed102A._id,
            title: "WiFi access point keeps dropping packets",
            description: "High packet loss on 5GHz band in 1st floor corridor between 8 PM and 11 PM.",
            category: "internet",
            priority: "high",
            status: "pending",
        }),
    ]);

    console.log("📢 Publishing Hostel Notices...");
    await Promise.all([
        Notice.create({
            title: "Special Dinner & Revised Mess Timings for Weekend",
            content: "Please note that mess dinner timings for Saturday and Sunday are extended to 10:30 PM with special festive North-Indian and South-Indian menu.",
            category: "mess",
            priority: "normal",
            targetHostel: null,
            publishedBy: warden._id,
        }),
        Notice.create({
            title: "Overnight Campus Water Supply Maintenance",
            content: "Routine pipeline maintenance and overhead tank chlorination will be conducted between 1:00 AM and 5:00 AM on Wednesday. Residents are requested to store necessary water.",
            category: "maintenance",
            priority: "important",
            targetHostel: brahmaputra._id,
            publishedBy: admin._id,
        }),
        Notice.create({
            title: "Campus Gate Curfew and Late Entry Regulations",
            content: "All undergraduate residents are reminded that main hostel entry closes promptly at 11:00 PM. Gate registers must be signed for any academic lab permissions.",
            category: "curfew",
            priority: "urgent",
            targetHostel: null,
            publishedBy: warden._id,
        }),
    ]);

    console.log("📋 Logging Visitor Records...");
    await Promise.all([
        Visitor.create({
            visitorName: "Sunil Sharma",
            visitorPhone: "9812345678",
            student: student1._id,
            hostel: brahmaputra._id,
            purpose: "Guardian visit from home town",
            idProofType: "Aadhaar",
            checkIn: new Date(Date.now() - 3600000 * 2),
            status: "inside",
            recordedBy: warden._id,
        }),
        Visitor.create({
            visitorName: "Deepak Patel",
            visitorPhone: "9876512345",
            student: student2._id,
            hostel: disang._id,
            purpose: "Delivering luggage & books",
            idProofType: "Driving License",
            checkIn: new Date(Date.now() - 3600000 * 6),
            checkOut: new Date(Date.now() - 3600000 * 5),
            status: "checked_out",
            recordedBy: warden._id,
        }),
    ]);

    console.log("\n=======================================================");
    console.log("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=======================================================");
    console.log("Demo Credentials:");
    console.log("  👑 Administrator: admin@example.com / AdminPass@123");
    console.log("  🏢 Warden:        warden@example.com / WardenPass@123");
    console.log("  🛠️ Staff:         staff@example.com / StaffPass@123");
    console.log("  🎓 Student:       student@example.com / StudentPass@123");
    console.log("=======================================================\n");

    await mongoose.disconnect();
    process.exit(0);
}

seedDatabase().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
