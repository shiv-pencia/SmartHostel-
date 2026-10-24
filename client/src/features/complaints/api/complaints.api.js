import httpClient from "../../../api/httpClient.js";

export const getComplaints = async (params = {}) => {
    const response = await httpClient.get("/complaints", { params });
    return response.data;
};

export const getComplaintById = async (complaintId) => {
    const response = await httpClient.get(`/complaints/${complaintId}`);
    return response.data;
};

export const createComplaint = async (payload) => {
    const response = await httpClient.post("/complaints", payload);
    return response.data;
};

export const assignComplaint = async (complaintId, payload) => {
    const response = await httpClient.patch(
        `/complaints/${complaintId}/assign`,
        payload
    );
    return response.data;
};

export const updateComplaintStatus = async (complaintId, payload) => {
    const response = await httpClient.patch(
        `/complaints/${complaintId}/status`,
        payload
    );
    return response.data;
};

export const getComplaintStats = async (params = {}) => {
    const response = await httpClient.get("/complaints/stats", { params });
    return response.data;
};

export const getMaintenanceStaff = async () => {
    const response = await httpClient.get("/users", {
        params: {
            role: "staff",
            status: "active",
            limit: 100,
        },
    });
    return response.data;
};
