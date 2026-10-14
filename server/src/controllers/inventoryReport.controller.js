
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

import {
    getInventoryReport,
} from "../services/inventoryReport.service.js";

export const inventoryReport = asyncHandler(
    async (req, res) => {
        const report = await getInventoryReport();

        return sendSuccess(res, {
            message: "Inventory report generated successfully",
            data: report,
        });
    }
);
