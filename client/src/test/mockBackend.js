
import MockAdapter from "axios-mock-adapter";

import httpClient from "../api/httpClient.js";

export const adminFixture = {
    id: "507f1f77bcf86cd799439011",
    name: "Admin User",
    email: "admin@example.com",
    phone: "9876543210",
    role: "admin",
    isActive: true,
};

export const studentFixture = {
    id: "507f191e810c19729de860ea",
    name: "Rahul Sharma",
    email: "rahul@example.com",
    phone: "9876543211",
    role: "student",
    isActive: true,
};

export const wardenFixture = {
    id: "507f1f77bcf86cd799439012",
    name: "Priya Singh",
    email: "priya@example.com",
    phone: "9876543212",
    role: "warden",
    isActive: true,
};

const success = (data, message = "Success") => ({
    success: true,
    message,
    data,
});

const failure = (message) => ({
    success: false,
    message,
});

export function createMockBackend({
    session = null,
    accounts = [
        adminFixture,
        studentFixture,
        wardenFixture,
    ],
} = {}) {
    const mock = new MockAdapter(httpClient, {
        onNoMatch: "throwException",
    });

    const users = accounts.map((user) => ({ ...user }));

    let currentSession = session
        ? { ...session }
        : null;

    const findUser = (id) =>
        users.find((user) => user.id === id);

    const requireAdmin = () => {
        return currentSession?.role === "admin";
    };

    /*
     * AUTHENTICATION
     */

    mock.onGet("/auth/me").reply(() => {
        if (!currentSession || !currentSession.isActive) {
            return [
                401,
                failure("Authentication required. Please login."),
            ];
        }

        return [
            200,
            success({ user: currentSession }),
        ];
    });

    mock.onPost("/auth/login").reply((config) => {
        const credentials = JSON.parse(config.data);

        const account = users.find(
            (user) =>
                user.email === credentials.email &&
                user.isActive
        );

        // Simulated test password for fixture accounts.
        if (
            !account ||
            credentials.password !== "TestPass@123"
        ) {
            return [
                401,
                failure("Invalid email or password"),
            ];
        }

        currentSession = { ...account };

        return [
            200,
            success(
                { user: currentSession },
                "Login successful"
            ),
        ];
    });

    mock.onPost("/auth/register").reply((config) => {
        const payload = JSON.parse(config.data);

        if (
            users.some(
                (user) => user.email === payload.email
            )
        ) {
            return [
                409,
                failure("Email is already registered"),
            ];
        }

        const newUser = {
            id: `test-user-${users.length + 1}`,
            name: payload.name,
            email: payload.email,
            phone: payload.phone ?? null,
            role: "student",
            isActive: true,
        };

        users.push(newUser);

        return [
            201,
            success(
                { user: newUser },
                "Student registered successfully"
            ),
        ];
    });

    mock.onPost("/auth/logout").reply(() => {
        currentSession = null;

        return [
            200,
            success(null, "Logout successful"),
        ];
    });

    /*
     * USER MANAGEMENT
     */

    mock.onGet("/users").reply((config) => {
        if (!requireAdmin()) {
            return [403, failure("Forbidden")];
        }

        const {
            page = 1,
            limit = 10,
            search = "",
            role = "",
            status = "",
        } = config.params ?? {};

        let filtered = [...users];

        if (search) {
            const term = String(search).toLowerCase();

            filtered = filtered.filter(
                (user) =>
                    user.name.toLowerCase().includes(term) ||
                    user.email.toLowerCase().includes(term)
            );
        }

        if (role) {
            filtered = filtered.filter(
                (user) => user.role === role
            );
        }

        if (status) {
            filtered = filtered.filter(
                (user) =>
                    user.isActive === (status === "active")
            );
        }

        const pageNumber = Number(page);
        const pageSize = Number(limit);

        const start = (pageNumber - 1) * pageSize;
        const pageUsers = filtered.slice(
            start,
            start + pageSize
        );

        return [
            200,
            {
                success: true,
                message: "Users retrieved successfully",
                data: pageUsers,
                meta: {
                    page: pageNumber,
                    limit: pageSize,
                    total: filtered.length,
                    totalPages: Math.ceil(
                        filtered.length / pageSize
                    ),
                },
            },
        ];
    });

    mock.onGet(/^\/users\/[^/]+$/).reply((config) => {
        if (!requireAdmin()) {
            return [403, failure("Forbidden")];
        }

        const id = decodeURIComponent(
            config.url.split("/")[2]
        );

        const user = findUser(id);

        return user
            ? [200, success({ user })]
            : [404, failure("User not found")];
    });

    mock.onPatch(/^\/users\/[^/]+$/).reply((config) => {
        if (!requireAdmin()) {
            return [403, failure("Forbidden")];
        }

        const id = decodeURIComponent(
            config.url.split("/")[2]
        );

        const user = findUser(id);

        if (!user) {
            return [404, failure("User not found")];
        }

        const data = JSON.parse(config.data);

        if (data.name !== undefined) {
            user.name = data.name;
        }

        if (data.phone !== undefined) {
            user.phone = data.phone;
        }

        if (currentSession?.id === user.id) {
            currentSession = { ...user };
        }

        return [
            200,
            success({ user }, "User updated successfully"),
        ];
    });

    mock.onPatch(/^\/users\/[^/]+\/role$/).reply(
        (config) => {
            if (!requireAdmin()) {
                return [403, failure("Forbidden")];
            }

            const id = config.url.split("/")[2];
            const user = findUser(id);

            if (!user) {
                return [404, failure("User not found")];
            }

            const { role } = JSON.parse(config.data);

            if (
                user.role === "admin" ||
                role === "admin"
            ) {
                return [
                    403,
                    failure("Administrator role assignment is restricted"),
                ];
            }

            user.role = role;

            return [
                200,
                success({ user }, "User role updated successfully"),
            ];
        }
    );

    mock.onPatch(/^\/users\/[^/]+\/status$/).reply(
        (config) => {
            if (!requireAdmin()) {
                return [403, failure("Forbidden")];
            }

            const id = config.url.split("/")[2];
            const user = findUser(id);

            if (!user) {
                return [404, failure("User not found")];
            }

            if (user.role === "admin") {
                return [
                    403,
                    failure(
                        "Administrator account status cannot be changed here"
                    ),
                ];
            }

            const { isActive } = JSON.parse(config.data);

            user.isActive = isActive;

            return [
                200,
                success(
                    { user },
                    "User status updated successfully"
                ),
            ];
        }
    );

    return {
        mock,
        users,
        getSession: () => currentSession,
    };
}
