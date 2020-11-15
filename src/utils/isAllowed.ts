/**
 * compares hasRoles to requiredRoles and returns true if hasRoles
 * includes any one of the requiredRoles
 */
export default function isAllowed(hasRoles: string[], requiredRoles: string[]) {
    const hasRolesSet = new Set(hasRoles);
    return requiredRoles.find((role) => hasRolesSet.has(role));
}
