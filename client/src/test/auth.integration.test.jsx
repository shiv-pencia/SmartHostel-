
import {
    describe,
    it,
    expect,
    afterEach,
} from "vitest";

import {
    render,
    screen,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import { MemoryRouter } from "react-router";

import App from "../App.jsx";

import {
    createMockBackend,
    adminFixture,
    studentFixture,
} from "./mockBackend.js";

let backend;

const renderApp = (path) => {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <App />
        </MemoryRouter>
    );
};

afterEach(() => {
    backend?.mock.restore();
    backend = null;
});

describe("Authentication integration", () => {
    it("redirects a guest from /admin to login", async () => {
        backend = createMockBackend();

        renderApp("/admin");

        expect(
            await screen.findByRole("heading", {
                name: "Welcome back",
            })
        ).toBeInTheDocument();

        expect(
            backend.mock.history.get.some(
                (request) => request.url === "/auth/me"
            )
        ).toBe(true);
    });

    it("logs in a student and opens their dashboard", async () => {
        backend = createMockBackend();

        const user = userEvent.setup();

        renderApp("/login");

        await screen.findByRole("heading", {
            name: "Welcome back",
        });

        await user.type(
            screen.getByLabelText("Email address"),
            "rahul@example.com"
        );

        await user.type(
            screen.getByLabelText("Password"),
            "TestPass@123"
        );

        await user.click(
            screen.getByRole("button", {
                name: "Sign In",
            })
        );

        expect(
            await screen.findByRole("heading", {
                name: "Welcome back, Rahul Sharma!",
            })
        ).toBeInTheDocument();

        expect(backend.getSession()?.role).toBe("student");

        const loginRequest = backend.mock.history.post.find(
            (request) => request.url === "/auth/login"
        );

        expect(loginRequest).toBeDefined();

        expect(loginRequest.withCredentials).toBe(true);

        expect(
            loginRequest.headers.get("X-Requested-With")
        ).toBe("XMLHttpRequest");
    });

    it("shows an error for incorrect login credentials", async () => {
        backend = createMockBackend();

        const user = userEvent.setup();

        renderApp("/login");

        await screen.findByRole("heading", {
            name: "Welcome back",
        });

        await user.type(
            screen.getByLabelText("Email address"),
            "rahul@example.com"
        );

        await user.type(
            screen.getByLabelText("Password"),
            "WrongPassword123"
        );

        await user.click(
            screen.getByRole("button", {
                name: "Sign In",
            })
        );

        expect(
            await screen.findByText(
                "Invalid email or password"
            )
        ).toBeInTheDocument();

        expect(backend.getSession()).toBeNull();
    });

    it("registers a student and opens the login page", async () => {
        backend = createMockBackend();

        const user = userEvent.setup();

        renderApp("/register");

        await screen.findByRole("heading", {
            name: "Create your account",
        });

        await user.type(
            screen.getByLabelText("Full name"),
            "New Student"
        );

        await user.type(
            screen.getByLabelText("Email address"),
            "new.student@example.com"
        );

        await user.type(
            screen.getByLabelText("Password", {
                exact: true,
            }),
            "NewPass@123"
        );

        await user.type(
            screen.getByLabelText("Confirm password"),
            "NewPass@123"
        );

        await user.click(
            screen.getByRole("button", {
                name: "Create Account",
            })
        );

        expect(
            await screen.findByText(
                /Account created successfully/
            )
        ).toBeInTheDocument();

        expect(
            backend.users.some(
                (account) =>
                    account.email === "new.student@example.com" &&
                    account.role === "student"
            )
        ).toBe(true);
    });

    it("restores an administrator session on app startup", async () => {
        backend = createMockBackend({
            session: adminFixture,
        });

        renderApp("/admin");

        expect(
            await screen.findByRole("heading", {
                name: "Welcome back, Admin User!",
            })
        ).toBeInTheDocument();

        expect(
            backend.mock.history.get.some(
                (request) => request.url === "/auth/me"
            )
        ).toBe(true);
    });

    it("redirects a student away from administrator pages", async () => {
        backend = createMockBackend({
            session: studentFixture,
        });

        renderApp("/admin/users");

        expect(
            await screen.findByRole("heading", {
                name: "Welcome back, Rahul Sharma!",
            })
        ).toBeInTheDocument();

        expect(
            screen.queryByRole("heading", {
                name: "User Management",
            })
        ).not.toBeInTheDocument();
    });

    it("logs out and returns to the login page", async () => {
        backend = createMockBackend({
            session: studentFixture,
        });

        const user = userEvent.setup();

        renderApp("/student");

        await screen.findByRole("heading", {
            name: "Welcome back, Rahul Sharma!",
        });

        await user.click(
            screen.getByRole("button", {
                name: "Logout",
            })
        );

        expect(
            await screen.findByRole("heading", {
                name: "Welcome back",
            })
        ).toBeInTheDocument();

        expect(backend.getSession()).toBeNull();

        expect(
            backend.mock.history.post.some(
                (request) => request.url === "/auth/logout"
            )
        ).toBe(true);
    });
});
