import mongoose from "mongoose";
import env from "./config/env.js";
import Hostel from "./models/hostel.model.js";
import Room from "./models/room.model.js";
import Bed from "./models/bed.model.js";

export const iitgHostelsData = [
    {
        name: "Brahmaputra Hostel",
        code: "BRH",
        genderPolicy: "male",
        location: "North Campus, Near Serpentine Lake, IIT Guwahati",
        description: "One of the largest boys hostels situated on the scenic lakeside.",
    },
    {
        name: "Barak Hostel",
        code: "BAR",
        genderPolicy: "male",
        location: "North Campus, Near Sports Complex, IIT Guwahati",
        description: "Premier boys hostel adjacent to the athletic track and gymnasium.",
    },
    {
        name: "Kapili Hostel",
        code: "KAP",
        genderPolicy: "male",
        location: "Central Campus, Near Khokha Market, IIT Guwahati",
        description: "Centrally located hostel with convenient access to student food court.",
    },
    {
        name: "Dihing Hostel",
        code: "DIH",
        genderPolicy: "male",
        location: "South-East Campus, IIT Guwahati",
        description: "Senior undergraduate and postgraduate resident hall.",
    },
    {
        name: "Dibang Hostel",
        code: "DIB",
        genderPolicy: "male",
        location: "South Campus, IIT Guwahati",
        description: "Modern multi-storey hostel with dedicated reading rooms.",
    },
    {
        name: "Manas Hostel",
        code: "MAN",
        genderPolicy: "male",
        location: "West Campus, Near Football Ground, IIT Guwahati",
        description: "Hostel with active sports community and lush green surroundings.",
    },
    {
        name: "Kameng Hostel",
        code: "KAM",
        genderPolicy: "male",
        location: "South-West Campus, IIT Guwahati",
        description: "Spacious hostel facility with landscaped inner courtyards.",
    },
    {
        name: "Umiam Hostel",
        code: "UMI",
        genderPolicy: "male",
        location: "West Campus, Beside Subansiri, IIT Guwahati",
        description: "Quiet and serene resident accommodation facing hills.",
    },
    {
        name: "Siang Hostel",
        code: "SIA",
        genderPolicy: "male",
        location: "North-East Campus, IIT Guwahati",
        description: "Known for active cultural celebrations and open air auditorium.",
    },
    {
        name: "Lohit Hostel",
        code: "LOH",
        genderPolicy: "male",
        location: "Central Campus, Behind SAC, IIT Guwahati",
        description: "Heart of campus life, close to Student Affairs Centre.",
    },
    {
        name: "Disang Hostel",
        code: "DIS",
        genderPolicy: "male",
        location: "East Campus, Near Hospital, IIT Guwahati",
        description: "Peaceful environment with 24/7 high speed campus LAN access.",
    },
    {
        name: "Subansiri Hostel",
        code: "SUB",
        genderPolicy: "female",
        location: "Girls Hostel Complex, South Campus, IIT Guwahati",
        description: "First girls hostel of IIT Guwahati with dedicated badminton court.",
    },
    {
        name: "Dhansiri Hostel",
        code: "DHA",
        genderPolicy: "female",
        location: "Girls Hostel Complex, South Campus, IIT Guwahati",
        description: "Modern girls hostel with contemporary dining hall and gymnasium.",
    },
    {
        name: "Married Scholars Hostel",
        code: "MSH",
        genderPolicy: "coed",
        location: "Faculty & Scholar Residential Area, IIT Guwahati",
        description: "Self-contained apartments for PhD and married research scholars.",
    },
];

async function seedIITGHostels() {
    console.log("🌱 Connecting to MongoDB for IIT Guwahati Hostels Seeding...");
    await mongoose.connect(env.mongodbUri);
    console.log(" Connected to MongoDB:", env.mongodbUri);

    console.log("🏢 Seeding all 14 official hostels of IIT Guwahati...");
    let addedCount = 0;
    let updatedCount = 0;

    for (const hData of iitgHostelsData) {
        let hostel = await Hostel.findOne({ code: hData.code });

        if (!hostel) {
            hostel = await Hostel.create({
                name: hData.name,
                code: hData.code,
                genderPolicy: hData.genderPolicy,
                location: hData.location,
                isActive: true,
            });
            addedCount++;
            console.log(`  ➕ Created: ${hostel.name} (${hostel.code})`);
        } else {
            hostel.name = hData.name;
            hostel.location = hData.location;
            hostel.genderPolicy = hData.genderPolicy;
            hostel.isActive = true;
            await hostel.save();
            updatedCount++;
            console.log(`  🔄 Updated: ${hostel.name} (${hostel.code})`);
        }

        // Ensure hostel has rooms and provisioned beds
        const existingRoomsCount = await Room.countDocuments({ hostel: hostel._id });
        if (existingRoomsCount === 0) {
            // Create 3 standard sample rooms for this hostel
            const room101 = await Room.create({
                hostel: hostel._id,
                roomNumber: "101",
                floor: 1,
                capacity: 2,
                bedCount: 2,
                roomType: "standard",
                status: "active",
            });
            await Bed.create({ room: room101._id, bedNumber: "101-A", operationalStatus: "usable" });
            await Bed.create({ room: room101._id, bedNumber: "101-B", operationalStatus: "usable" });

            const room102 = await Room.create({
                hostel: hostel._id,
                roomNumber: "102",
                floor: 1,
                capacity: 2,
                bedCount: 2,
                roomType: "standard",
                status: "active",
            });
            await Bed.create({ room: room102._id, bedNumber: "102-A", operationalStatus: "usable" });
            await Bed.create({ room: room102._id, bedNumber: "102-B", operationalStatus: "usable" });

            const room201 = await Room.create({
                hostel: hostel._id,
                roomNumber: "201",
                floor: 2,
                capacity: 1,
                bedCount: 1,
                roomType: "standard",
                status: "active",
            });
            await Bed.create({ room: room201._id, bedNumber: "201-A", operationalStatus: "usable" });
        }
    }

    const totalHostels = await Hostel.countDocuments();
    const totalRooms = await Room.countDocuments();
    const totalBeds = await Bed.countDocuments();

    console.log("\n=======================================================");
    console.log("✅ ALL 14 IIT GUWAHATI HOSTELS SEEDED SUCCESSFULLY!");
    console.log("=======================================================");
    console.log(`🏢 Total Hostels:  ${totalHostels}`);
    console.log(`🚪 Total Rooms:    ${totalRooms}`);
    console.log(`🛏️ Total Beds:     ${totalBeds}`);
    console.log("=======================================================");
    console.log("List of Hostels:");
    const allHostels = await Hostel.find().sort({ name: 1 });
    allHostels.forEach((h, idx) => {
        console.log(`  ${idx + 1}. [${h.code}] ${h.name} (${h.genderPolicy}) - ${h.location}`);
    });
    console.log("=======================================================\n");

    await mongoose.disconnect();
    process.exit(0);
}

seedIITGHostels().catch((err) => {
    console.error("❌ Seeding IIT Guwahati hostels failed:", err);
    process.exit(1);
});
