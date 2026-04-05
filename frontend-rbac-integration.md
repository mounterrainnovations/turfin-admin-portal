# Sub-Admin RBAC Integration Guide

This document provides the frontend team with the necessary architectural context, API contracts, and implementation patterns to integrate the fine-grained, permission-based Role-Based Access Control (RBAC) system.

## 1. Core Architectural Concept

The system uses a **Dynamic Permission-Based RBAC** model:
- **Permissions**: Hardcoded `resource:action` strings (e.g., `vendor:read`, `kyc:review`).
- **Roles**: Collections of permissions. These are created dynamically by the Super Admin in the dashboard.
- **Identities**: Users assigned one or more roles.
- **Wildcard**: `SUPER_ADMIN` has a `*` permission, bypassing all individual checks.

---

## 2. Authentication Changes

The `Identity` object returned during `signin`, `signup`, and `refreshTokens` now includes a `permissions` array.

### Updated Identity Type
```typescript
interface Identity {
  id: string;
  email: string;
  roles: string[];      // List of role names (e.g., ["sub_admin", "KYC Lead"])
  permissions: string[]; // List of permission strings (e.g., ["vendor:read", "kyc:review"])
  profileCompleted: boolean;
}
```

> [!IMPORTANT]
> When a Super Admin logs in, the `permissions` array will be `["*"]`. You should treat this as "God Mode."

---

## 3. Frontend Enforcement Patterns

To check if a user can see a button or access a page, check the `permissions` array in your global state.

### Recommended Helper Logic
```typescript
/**
 * Returns true if the user has the required permission OR is a super admin.
 * @param userPermissions The permissions array from the JWT identity
 * @param resource The resource being checked (e.g., 'vendor')
 * @param action The action being checked (e.g., 'read')
 */
export const hasPermission = (
  userPermissions: string[],
  resource: string,
  action: string
): boolean => {
  if (userPermissions.includes('*')) return true; // Super Admin bypass
  return userPermissions.includes(`${resource}:${action}`);
};
```

---

## 4. API Endpoints Reference

All endpoints are prefixed with `/api/v1`.

### 4.1. Sub-Admin User Management

#### **List All Sub-Admins**
- **Endpoint**: `GET /admin/sub-admins`
- **Description**: Returns all users with the `sub_admin` role, including their custom roles.
- **Response**: `SubAdminListItem[]`

#### **Create Sub-Admin**
- **Endpoint**: `POST /admin/sub-admins`
- **Body**: `CreateSubAdminDto`
- **Description**: Creates a new identity in the system with the `sub_admin` role.

#### **Assign Roles to Sub-Admin**
- **Endpoint**: `PATCH /admin/sub-admins/:id/roles`
- **Body**: `{ roleIds: string[] }`
- **Description**: Replaces the full set of custom roles for a sub-admin.

---

### 4.2. Custom Role Management

#### **List Custom Roles**
- **Endpoint**: `GET /admin/sub-admins/roles`
- **Description**: Returns all custom admin roles, including their full permission objects.
- **Response**: `CustomRoleItem[]`

#### **Create Custom Role**
- **Endpoint**: `POST /admin/sub-admins/roles`
- **Body**: `CreateRoleDto`
- **Description**: Creates a new role and optionally assigns initial permissions.

#### **Update Role Permissions**
- **Endpoint**: `PATCH /admin/sub-admins/roles/:roleId/permissions`
- **Body**: `{ permissionIds: string[] }`
- **Description**: Replaces the full set of permissions associated with a role.

#### **Delete Custom Role**
- **Endpoint**: `DELETE /admin/sub-admins/roles/:roleId`
- **Description**: Deletes the role. Note: This will automatically unassign it from all users.

---

### 4.3. Permission Catalogue

#### **List Available Permissions**
- **Endpoint**: `GET /admin/sub-admins/permissions`
- **Description**: Returns the full list of selectable permissions to be used in the role-creation UI.
- **Response**: `PermissionListItem[]`

---

## 5. Data Transfer Objects (DTOs)

Use these TypeScript interfaces for your API client.

```typescript
// --- Shared ---
interface PermissionListItem {
  id: string;
  resource: string;
  action: string;
  description: string;
}

interface RoleSummary {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
}

// --- List Items ---
interface SubAdminListItem {
  id: string;
  email: string;
  roles: RoleSummary[]; // Hydrated list of assigned roles
  createdAt: string;
}

interface CustomRoleItem extends RoleSummary {
  permissions: PermissionListItem[]; // Hydrated list of permissions
}

// --- Request Payloads ---
interface CreateSubAdminDto {
  email: string;
  password?: string; // Optional if you want to generate one or let them set it later
}

interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds?: string[];
}

interface UpdateRolePermissionsDto {
  permissionIds: string[];
}

interface AssignRolesToSubAdminDto {
  roleIds: string[];
}
```

---

## 6. Super Admin UI Example

When building the "Role Management" table:
1.  **Fetch Permissions**: Use `GET /permissions` to populate a checklist in your "Create/Edit Role" modal.
2.  **Fetch Roles**: Use `GET /roles` to display the table. Each row should show the name and a summary of the `action:resource` chips.
3.  **Update Flow**: When the user changes checkboxes in the "Edit Permissions" modal, send the full array of IDs to `PATCH /roles/:id/permissions`.

---

## 7. Protected Route Logic

If your frontend uses a route guard, you can now protect entire sections based on the identity permissions:

```typescript
// Example: Protect the 'KYC Review' page
if (!hasPermission(user.permissions, 'kyc', 'review')) {
  // Redirect to dashboard or show 'Access Denied'
}
```
