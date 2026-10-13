
export const ROLE_HOME_PATHS = Object.freeze({
    student: "/student",
    warden: "/warden",
    staff: "/staff",
    admin: "/admin",
});

export const getRoleHome = (role) => {
    return ROLE_HOME_PATHS[role] || "/";
};
