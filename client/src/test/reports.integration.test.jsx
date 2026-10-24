import { describe, it, expect, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import App from "../App.jsx";
import {
    createMockBackend,
    adminFixture,
} from "./mockBackend.js";

let backend;

const renderAdminReports = () => {
    return render(
        <MemoryRouter initialEntries={["/admin/reports"]}>
            <App />
        </MemoryRouter>
    );
};

const renderAdminDashboard = () => {
    return render(
        <MemoryRouter initialEntries={["/admin"]}>
            <App />
        </MemoryRouter>
    );
};

afterEach(() => {
    backend?.mock.restore();
    backend = null;
});

describe("Reports & Analytics Integration", () => {
    it("renders Admin Reports page with Occupancy statistics and KPIs", async () => {
        backend = createMockBackend({
            session: adminFixture,
        });

        renderAdminReports();

        expect(
            await screen.findByRole("heading", { name: "Hostel Reports & Analytics" })
        ).toBeInTheDocument();

        // Check tabs exist
        expect(screen.getByRole("button", { name: /Occupancy Statistics/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Complaint Analytics/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Inventory & Integrity/i })).toBeInTheDocument();

        // Check Occupancy summary cards
        expect(await screen.findByText("Total Capacity")).toBeInTheDocument();
        expect(screen.getAllByText("Usable Beds").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("Occupancy Rate").length).toBeGreaterThanOrEqual(1);

        // Check Hostel Breakdown table
        expect(screen.getByText("Hostel-wise Occupancy & Vacancy Breakdown")).toBeInTheDocument();
        expect(screen.getAllByText(/Brahmaputra Hostel/i).length).toBeGreaterThanOrEqual(1);
    });

    it("switches to Complaint Analytics tab and displays grievance telemetry", async () => {
        const user = userEvent.setup();
        backend = createMockBackend({
            session: adminFixture,
        });

        renderAdminReports();

        expect(
            await screen.findByRole("heading", { name: "Hostel Reports & Analytics" })
        ).toBeInTheDocument();

        const complaintTabBtn = screen.getByRole("button", { name: /Complaint Analytics/i });
        await user.click(complaintTabBtn);

        expect(await screen.findByText("Total Grievances")).toBeInTheDocument();
        expect(screen.getByText("Action Required")).toBeInTheDocument();
        expect(screen.getByText("Grievance Category Distribution")).toBeInTheDocument();
    });

    it("switches to Inventory & Integrity tab and displays physical verification", async () => {
        const user = userEvent.setup();
        backend = createMockBackend({
            session: adminFixture,
        });

        renderAdminReports();

        expect(
            await screen.findByRole("heading", { name: "Hostel Reports & Analytics" })
        ).toBeInTheDocument();

        const inventoryTabBtn = screen.getByRole("button", { name: /Inventory & Integrity/i });
        await user.click(inventoryTabBtn);

        expect(await screen.findByText("Physical Bed Inventory & Capacity Verification")).toBeInTheDocument();
        expect(screen.getByText("Audit Clean:")).toBeInTheDocument();
    });

    it("renders live occupancy and grievances telemetry on Admin Dashboard overview", async () => {
        backend = createMockBackend({
            session: adminFixture,
        });

        renderAdminDashboard();

        expect(
            await screen.findByRole("heading", { name: /Welcome back, Admin User!/i })
        ).toBeInTheDocument();

        // Should load live occupancy and grievance cards
        expect(await screen.findByText("Hostel Occupancy")).toBeInTheDocument();
        expect(await screen.findByText("Pending Grievances")).toBeInTheDocument();
        expect(await screen.findByText("Student Residents")).toBeInTheDocument();
    });
});
