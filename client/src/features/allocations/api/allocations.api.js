
import httpClient from "../../../api/httpClient.js";

export const getStudents = async () => {
    const response = await httpClient.get("/users", {
        params: {
            role: "student",
            status: "active",
            limit: 100,
        },
    });

    return response.data;
};

export const getVacantBeds = async (hostelId) => {
    const response = await httpClient.get("/allocations/vacancies", {
        params: hostelId ? { hostelId } : {},
    });

    return response.data;
};

export const createAllocation = async (payload) => {
    const response = await httpClient.post("/allocations", payload);
    return response.data;
};

export const getAllocations = async (params = {}) => {
    const response = await httpClient.get("/allocations", {
        params,
    });

    return response.data;
};

export const vacateAllocation = async (allocationId) => {
    const response = await httpClient.patch(
        `/allocations/${allocationId}/vacate`
    );

    return response.data;
};

export const getMyAllocation = async () => {
    const response = await httpClient.get("/allocations/my");
    return response.data;
};
