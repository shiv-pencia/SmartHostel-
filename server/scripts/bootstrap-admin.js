
import mongoose from "mongoose";

import connectDB from "../src/config/db.js";
import env from "../src/config/env.js";
import User from "../src/models/user.model.js";

const bootstrapAdmin = async () => {
    try {
        if (env.nodeEnv !== "development") {
            throw new Error(
                "Admin bootstrap is restricted to development mode"
            );
        }

        const email = process.env.BOOTSTRAP_ADMIN_EMAIL
            ?.trim()
            .toLowerCase();

        if (!email) {
            throw new Error(
                "BOOTSTRAP_ADMIN_EMAIL is required"
            );
        }

        await connectDB();

        // Do not bootstrap if an administrator exists
        const adminExists = await User.exists({
            role: "admin",
        });

        if (adminExists) {
            throw new Error(
                "An administrator already exists"
            );
        }

        // Find an existing active student account
        const user = await User.findOne({
            email,
            role: "student",
            isActive: true,
        });

        if (!user) {
            throw new Error(
                "No active student found with this email"
            );
        }

        // Promote only this existing account
        user.role = "admin";

        await user.save();

        console.log(
            `Administrator created: ${user.email}`
        );

    } catch (error) {
        console.error(
            "Bootstrap failed:",
            error.message
        );

        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
};

bootstrapAdmin();
