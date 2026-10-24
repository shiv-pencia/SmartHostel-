import httpClient from "../../../api/httpClient.js";

/**
 * GET /api/v1/reports/inventory
 */
export const getInventoryReport = async (signal) => {
    const response = await httpClient.get("/reports/inventory", { signal });
    return response.data.data;
};

/**
 * GET /api/v1/reports/occupancy
 */
export const getOccupancyReport = async (params = {}, signal) => {
    const response = await httpClient.get("/reports/occupancy", {
        params,
        signal,
    });
    return response.data.data;
};

/**
 * GET /api/v1/reports/complaints
 */
export const getComplaintAnalytics = async (params = {}, signal) => {
    const response = await httpClient.get("/reports/complaints", {
        params,
        signal,
    });
    return response.data.data;
};

/**
 * GET /api/v1/reports/overview
 */
export const getDashboardOverview = async (signal) => {
    const response = await httpClient.get("/reports/overview", { signal });
    return response.data.data;
};
