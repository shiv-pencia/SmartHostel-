
import {
    describe,
    it,
    expect,
    afterEach,
} from "vitest";

import {
    render,
    screen,
    within,
    waitFor,
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

const renderAdminUsers = () => {
    return render(
        <MemoryRouter initialEntries={["/admin/users"]}>
            <App />
        </MemoryRouter>
    );
};

afterEach(() => {
    backend?.mock.restore();
    backend = null;
});

describe("Admin User Management integration", () => {
    it("loads registered users", async () => {
        backend = createMockBackend({
            session: adminFixture,
        });

        renderAdminUsers();

        expect(
            await screen.findByText("rahul@example.com")
        ).toBeInTheDocument();

        expect(
            screen.getByText("priya@example.com")
        ).toBeInTheDocument();

        expect(
            backend.mock.history.get.some(
                (request) => request.url === "/users"
            )
        ).toBe(true);
    });

    it("searches users by name", async () => {
        backend = createMockBackend({
            session: adminFixture,
        });

        const user = userEvent.setup();

        renderAdminUsers();

        await screen.findByText("priya@example.com");

        await user.type(
            screen.getByRole("searchbox", {
                name: "Search by name or email",
            }),
            "Rahul"
        );

        await user.click(
            screen.getByRole("button", {
                name: "Search",
            })
        );

        await waitFor(() => {
            expect(
                screen.getByText("rahul@example.com")
            ).toBeInTheDocument();

            expect(
                screen.queryByText("priya@example.com")
            ).not.toBeInTheDocument();
        });

        const searchRequest = backend.mock.history.get
            .filter((request) => request.url === "/users")
            .at(-1);

        expect(searchRequest.params.search).toBe("Rahul");
    });

    it("filters users by role", async () => {
        backend = createMockBackend({
            session: adminFixture,
        });

        const user = userEvent.setup();

        renderAdminUsers();

        await screen.findByText("rahul@example.com");

        await user.selectOptions(
            screen.getByRole("combobox", {
                name: "Filter by role",
            }),
            "warden"
        );

        await waitFor(() => {
            expect(
                screen.getByText("priya@example.com")
            ).toBeInTheDocument();

            expect(
                screen.queryByText("rahul@example.com")
            ).not.toBeInTheDocument();
        });
    });

    it("supports pagination", async () => {
        const students = Array.from(
            { length: 13 },
            (_, index) => ({
                ...studentFixture,
                id: `student-${index + 1}`,
                name: `Student ${index + 1}`,
                email: `student${index + 1}@example.com`,
            })
        );

        backend = createMockBackend({
            session: adminFixture,
            accounts: [adminFixture, ...students],
        });

        const user = userEvent.setup();

        renderAdminUsers();

        expect(
            await screen.findByText("Page 1 of 2")
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", {
                name: "Next page",
            })
        );

        expect(
            await screen.findByText("Page 2 of 2")
        ).toBeInTheDocument();

        const lastRequest = backend.mock.history.get
            .filter((request) => request.url === "/users")
            .at(-1);

        expect(lastRequest.params.page).toBe(2);
    });

    it("updates a user's name", async () => {
        backend = createMockBackend({
            session: adminFixture,
        });

        const user = userEvent.setup();

        renderAdminUsers();

        await screen.findByText("rahul@example.com");

        await user.click(
            screen.getByRole("button", {
                name: "View Rahul Sharma",
            })
        );

        const dialog = await screen.findByRole("dialog", {
            name: "User Details",
        });

        await within(dialog).findByDisplayValue(
            "Rahul Sharma"
        );

        const nameInput = within(dialog).getByRole(
            "textbox",
            { name: "Full name" }
        );

        await user.clear(nameInput);

        await user.type(nameInput, "Rahul Kumar");

        await user.click(
            within(dialog).getByRole("button", {
                name: "Save Profile",
            })
        );

        expect(
            await within(dialog).findByText(
                "Profile updated successfully."
            )
        ).toBeInTheDocument();

        expect(
            backend.users.find(
                (account) => account.id === studentFixture.id
            )?.name
        ).toBe("Rahul Kumar");
    });

    it("changes a role and deactivates an account", async () => {
        backend = createMockBackend({
            session: adminFixture,
        });

        const user = userEvent.setup();

        renderAdminUsers();

        await screen.findByText("rahul@example.com");

        await user.click(
            screen.getByRole("button", {
                name: "View Rahul Sharma",
            })
        );

        const dialog = await screen.findByRole("dialog", {
            name: "User Details",
        });

        await within(dialog).findByDisplayValue(
            "Rahul Sharma"
        );

        await user.selectOptions(
            within(dialog).getByRole("combobox", {
                name: "User role",
            }),
            "warden"
        );

        await user.click(
            within(dialog).getByRole("button", {
                name: "Update Role",
            })
        );

        await user.click(
            within(dialog).getByRole("button", {
                name: "Confirm Role Change",
            })
        );

        await waitFor(() => {
            expect(
                backend.users.find(
                    (account) => account.id === studentFixture.id
                )?.role
            ).toBe("warden");
        });

        await user.click(
            within(dialog).getByRole("button", {
                name: "Deactivate Account",
            })
        );

        await user.click(
            within(dialog).getByRole("button", {
                name: "Confirm Status Change",
            })
        );

        await waitFor(() => {
            expect(
                backend.users.find(
                    (account) => account.id === studentFixture.id
                )?.isActive
            ).toBe(false);
        });
    });

    it("does not offer privileged changes to admins", async () => {
        backend = createMockBackend({
            session: adminFixture,
        });

        const user = userEvent.setup();

        renderAdminUsers();

        await screen.findByText("admin@example.com");

        await user.click(
            screen.getByRole("button", {
                name: "View Admin User",
            })
        );

        const dialog = await screen.findByRole("dialog", {
            name: "User Details",
        });

        expect(
            await within(dialog).findByText(
                /Administrator roles cannot be modified/
            )
        ).toBeInTheDocument();

        expect(
            within(dialog).queryByRole("button", {
                name: "Deactivate Account",
            })
        ).not.toBeInTheDocument();

        expect(
            within(dialog).queryByRole("button", {
                name: "Update Role",
            })
        ).not.toBeInTheDocument();
    });
});
