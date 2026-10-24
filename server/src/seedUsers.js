import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import env from "./config/env.js";
import User from "./models/user.model.js";

const firstNames = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
    "Shaurya", "Atharva", "Advik", "Pranav", "Advaith", "Aaryan", "Dhruv", "Kabir", "Ritvik", "Darsh",
    "Ananya", "Diya", "Isha", "Saanvi", "Aarohi", "Aanya", "Pari", "Myra", "Anika", "Navya",
    "Sneha", "Pooja", "Riya", "Kavya", "Tanvi", "Shreya", "Khushi", "Meera", "Avani", "Tara",
    "Rohan", "Rahul", "Amit", "Naveen", "Deepak", "Siddharth", "Gaurav", "Harsh", "Karan", "Manish",
    "Neha", "Priya", "Swati", "Divya", "Anjali", "Simran", "Nidhi", "Pallavi", "Preeti", "Rashmi"
];

const lastNames = [
    "Sharma", "Verma", "Gupta", "Patel", "Singh", "Kumar", "Mishra", "Joshi", "Yadav", "Nair",
    "Reddy", "Choudhury", "Bose", "Banerjee", "Das", "Ghosh", "Iyer", "Rao", "Pillai", "Menon",
    "Bhat", "Kulkarni", "Deshmukh", "Patil", "Shinde", "Thakur", "Chauhan", "Pandey", "Tripathi", "Tiwari",
    "Agarwal", "Bansal", "Goel", "Mittals", "Singhal", "Mehta", "Shah", "Doshi", "Gandhi", "Chopra"
];

const branches = ["CSE", "ECE", "ME", "CE", "EE", "BT", "DS", "AI"];

async function seed500Users() {
    console.log("🌱 Connecting to MongoDB for 500 Users Seeding...");
    await mongoose.connect(env.mongodbUri);
    console.log(" Connected to MongoDB:", env.mongodbUri);

    // Hash default password once for high performance
    const defaultPassword = "StudentPass@123";
    console.log("🔐 Hashing default password for generated batch...");
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Check existing emails to prevent duplicate collisions
    const existingUsers = await User.find({}).select("email").lean();
    const existingEmailSet = new Set(existingUsers.map((u) => u.email.toLowerCase()));

    const usersToInsert = [];
    let counter = 1;

    console.log("👥 Generating 500 realistic resident student records...");
    while (usersToInsert.length < 500) {
        const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
        const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
        const name = `${fn} ${ln}`;

        // Create clean unique email
        const emailNumber = counter + 100;
        const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${emailNumber}@campus.edu`;

        if (!existingEmailSet.has(email)) {
            existingEmailSet.add(email);

            // Generate realistic 10-digit Indian phone number
            const phonePrefix = ["98", "97", "96", "95", "91", "88", "87", "85"][Math.floor(Math.random() * 8)];
            const phoneSuffix = Math.floor(10000000 + Math.random() * 90000000).toString().substring(0, 8);
            const phone = `${phonePrefix}${phoneSuffix}`;

            // Mostly students, with a few assistant wardens and support staff
            let role = "student";
            if (counter % 50 === 0) {
                role = "warden";
            } else if (counter % 35 === 0) {
                role = "staff";
            }

            usersToInsert.push({
                name,
                email,
                password: hashedPassword,
                phone,
                role,
                isActive: Math.random() > 0.05, // 95% active, 5% inactive to test status filter
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 60)),
            });
        }
        counter++;
    }

    console.log(`📦 Bulk inserting ${usersToInsert.length} user documents into MongoDB...`);
    await User.insertMany(usersToInsert);

    const totalUsers = await User.countDocuments();
    const studentCount = await User.countDocuments({ role: "student" });
    const wardenCount = await User.countDocuments({ role: "warden" });
    const staffCount = await User.countDocuments({ role: "staff" });
    const adminCount = await User.countDocuments({ role: "admin" });

    console.log("\n=======================================================");
    console.log(`✅ SUCCESSFULLY ADDED 500 USERS TO DATABASE!`);
    console.log("=======================================================");
    console.log(`📊 Total Users in System:  ${totalUsers}`);
    console.log(`   🎓 Students:            ${studentCount}`);
    console.log(`   🏢 Wardens:             ${wardenCount}`);
    console.log(`   🛠️ Staff:               ${staffCount}`);
    console.log(`   👑 Administrators:      ${adminCount}`);
    console.log(`🔑 All generated users have password: "${defaultPassword}"`);
    console.log("=======================================================\n");

    await mongoose.disconnect();
    process.exit(0);
}

seed500Users().catch((err) => {
    console.error("❌ Failed to seed 500 users:", err);
    process.exit(1);
});
