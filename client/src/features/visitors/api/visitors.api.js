import httpClient from "../../../api/httpClient.js";

export const listVisitors = async (params = {}, signal) => {
    const response = await httpClient.get("/visitors", { params, signal });
    return response.data.data;
};

export const logVisitorEntry = async (visitorData) => {
    const response = await httpClient.post("/visitors", visitorData);
    return response.data.data;
};

export const checkoutVisitor = async (visitorId) => {
    const response = await httpClient.patch(`/visitors/${visitorId}/checkout`);
    return response.data.data;
};
