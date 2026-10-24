
import {
    LayoutDashboard,
    Users,
    Building2,
    BedDouble,
    ChartColumnIncreasing,
    ClipboardList,
    MessageSquareWarning,
    Bell,
    ContactRound,
    Wrench,
} from "lucide-react";

/*
 * Navigation configuration by user role
 *
 * The overview page exists for every role.
 * Other links lead to module placeholders
 * until their features are implemented.
 */

export const dashboardNavigation = {
    admin: [
        {
            label: "Overview",
            path: "/admin",
            icon: LayoutDashboard,
            end: true,
        },
        {
            label: "Users",
            path: "/admin/users",
            icon: Users,
        },
        {
            label: "Hostels",
            path: "/admin/hostels",
            icon: Building2,
        },
        {
            label: "Rooms & Beds",
            path: "/admin/rooms",
            icon: BedDouble,
        },
        {
            label: "Allocations",
            path: "/admin/allocations",
            icon: ClipboardList,
        },
        {
            label: "Complaints",
            path: "/admin/complaints",
            icon: MessageSquareWarning,
        },
        {
            label: "Reports",
            path: "/admin/reports",
            icon: ChartColumnIncreasing,
        },
    ],

    student: [
        {
            label: "Overview",
            path: "/student",
            icon: LayoutDashboard,
            end: true,
        },
        {
            label: "My Allocation",
            path: "/student/allocation",
            icon: BedDouble,
        },
        {
            label: "Complaints",
            path: "/student/complaints",
            icon: MessageSquareWarning,
        },
        {
            label: "Notices",
            path: "/student/notices",
            icon: Bell,
        },
    ],

    warden: [
        {
            label: "Overview",
            path: "/warden",
            icon: LayoutDashboard,
            end: true,
        },
        {
            label: "Rooms",
            path: "/warden/rooms",
            icon: BedDouble,
        },
        {
            label: "Visitors",
            path: "/warden/visitors",
            icon: ContactRound,
        },
        {
            label: "Complaints",
            path: "/warden/complaints",
            icon: ClipboardList,
        },
    ],

    staff: [
        {
            label: "Overview",
            path: "/staff",
            icon: LayoutDashboard,
            end: true,
        },
        {
            label: "Assigned Tasks",
            path: "/staff/tasks",
            icon: ClipboardList,
        },
        {
            label: "Maintenance",
            path: "/staff/maintenance",
            icon: Wrench,
        },
    ],
};

export const roleLabels = {
    admin: "Administrator",
    student: "Student",
    warden: "Warden",
    staff: "Maintenance Staff",
};
