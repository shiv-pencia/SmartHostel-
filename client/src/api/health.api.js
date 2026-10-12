
import httpClient from "./httpClient.js";

/*
 * Check backend API availability
 */

export const checkBackendHealth = async () => {
    const response = await httpClient.get("/health");

    return response.data;
};
