
import axios from "axios";

/*
 * API Configuration
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
    throw new Error(
        "VITE_API_BASE_URL is missing from the frontend environment"
    );
}

/*
 * Create reusable Axios instance
 */

const httpClient = axios.create({
    baseURL: API_BASE_URL,

    timeout: 10000,

    withCredentials: true,

    headers: {
        Accept: "application/json",
    },
});

/*
 * REQUEST INTERCEPTOR
 *
 * Automatically attach the custom CSRF header
 * to state-changing requests.
 */

const writeMethods = new Set([
    "post",
    "put",
    "patch",
    "delete",
]);

httpClient.interceptors.request.use(
    (config) => {
        const method = (config.method || "get").toLowerCase();

        if (writeMethods.has(method)) {
            config.headers.set(
                "X-Requested-With",
                "XMLHttpRequest"
            );
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/*
 * RESPONSE INTERCEPTOR
 *
 * Convert failed requests into a consistent
 * error format for React components.
 */

httpClient.interceptors.response.use(
    (response) => response,

    (error) => {
        if (!axios.isAxiosError(error)) {
            return Promise.reject(error);
        }

        const status = error.response?.status ?? null;

        const serverMessage = error.response?.data?.message;

        let message = "Something went wrong";

        if (error.code === "ECONNABORTED") {
            message = "Request timed out. Please try again.";
        } else if (!error.response) {
            message = "Cannot connect to the server.";
        } else if (typeof serverMessage === "string") {
            message = serverMessage;
        } else {
            message = `Request failed with status ${status}`;
        }

        const apiError = new Error(message, {
            cause: error,
        });

        apiError.name = "ApiRequestError";
        apiError.status = status;

        apiError.details = Array.isArray(
            error.response?.data?.errors
        )
            ? error.response.data.errors
            : [];

        return Promise.reject(apiError);
    }
);

export default httpClient;
