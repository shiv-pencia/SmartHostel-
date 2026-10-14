
import httpClient from "../../../api/httpClient.js";

/*
 * GET /api/v1/reports/inventory
 */
export const getInventoryReport = async (signal) => {
    const response = await httpClient.get(
        "/reports/inventory",
        { signal }
    );

    return response.data.data;
};
