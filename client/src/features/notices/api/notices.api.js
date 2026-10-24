import httpClient from "../../../api/httpClient.js";

export const listNotices = async (params = {}, signal) => {
    const response = await httpClient.get("/notices", { params, signal });
    return response.data.data;
};

export const createNotice = async (noticeData) => {
    const response = await httpClient.post("/notices", noticeData);
    return response.data.data;
};
