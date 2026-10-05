/**
 * Application Permissions
 *
 * Currently reserved for future Permission-Based Access Control (PBAC).
 * Role-Based Access Control (RBAC) is active in Phase 1.
 */

export const PERMISSIONS = {} as const;

export type Permission =
  keyof typeof PERMISSIONS;