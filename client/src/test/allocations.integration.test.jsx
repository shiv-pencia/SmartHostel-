import { describe, it, expect, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import App from "../App.jsx";
import {
    createMockBackend,
    adminFixture,
    studentFixture,
} from "./mockBackend.js";

let backend;

const renderAdminAllocations = () => {
    return render(
        <MemoryRouter initialEntries={["/admin/allocations"]}>
            <App />
        </MemoryRouter>
    );
};

const renderStudentAllocation = () => {
    return render(
        <MemoryRouter initialEntries={["/student/allocation"]}>
            <App />
        </MemoryRouter>
    );
};

afterEach(() => {
    backend?.mock.restore();
    backend = null;
});

describe("Allocations Integration", () => {
    it("renders admin allocations page with data and stats", async () => {
        backend = createMockBackend({
            session: adminFixture,
        });

        renderAdminAllocations();

        expect(
            await screen.findByRole("heading", { name: "Student Allocation" })
        ).toBeInTheDocument();

        // Check stats
        expect(screen.getByText("Available beds")).toBeInTheDocument();
        expect(screen.getByText("Active allocations")).toBeInTheDocument();

        // Check allocation table row
        expect(await screen.findByText("Rahul Sharma")).toBeInTheDocument();
        expect(screen.getByText("rahul@example.com")).toBeInTheDocument();
        expect(screen.getAllByText(/Brahmaputra Hostel/i).length).toBeGreaterThanOrEqual(1);
    });

    it("renders student allocation page for assigned student", async () => {
        backend = createMockBackend({
            session: studentFixture,
        });

        renderStudentAllocation();

        expect(
            await screen.findByRole("heading", { name: "My Allocation" })
        ).toBeInTheDocument();

        expect(await screen.findByText("Active Allocation")).toBeInTheDocument();
        expect(screen.getByText("Brahmaputra Hostel")).toBeInTheDocument();
        expect(screen.getByText(/Room 101 · Bed B1/i)).toBeInTheDocument();
    });

    it("allows admin to vacate an active allocation", async () => {
        const user = userEvent.setup();
        window.confirm = () => true;

        backend = createMockBackend({
            session: adminFixture,
        });

        renderAdminAllocations();

        const vacateButton = await screen.findByRole("button", { name: "Vacate" });
        expect(vacateButton).toBeInTheDocument();

        await user.click(vacateButton);

        expect(
            await screen.findByText("Allocation vacated successfully.")
        ).toBeInTheDocument();
    });
});
