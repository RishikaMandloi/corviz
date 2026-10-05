import { UserRole } from "../constants";

/**
 * Determines whether a role
 * is allowed to access a resource.
 *
 * Future:
 * - Role Hierarchy
 * - Permissions
 * - Ownership Rules
 */
export class AccessPolicy {
  static canAccess(
    userRole: UserRole,
    allowedRoles: readonly UserRole[]
  ): boolean {
    return allowedRoles.includes(userRole);
  }
}