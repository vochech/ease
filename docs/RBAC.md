# Role-Based Access Control (RBAC)

This project implements organization-scoped role-based access control.

## Role Hierarchy

Roles are hierarchical with numerical ranks:

| Role     | Rank | Permissions                                    |
|----------|------|------------------------------------------------|
| `owner`  | 4    | Full control (delete org, manage all members) |
| `manager`| 3    | Manage projects, tasks, members                |
| `member` | 2    | Create and edit projects, tasks                |
| `viewer` | 1    | Read-only access                               |
| `invited`| 0    | No access (pending invitation)                 |

## Server-Side Usage

### API Route Protection

```typescript
// app/api/projects/[id]/route.ts
import { requireRole } from "@/lib/roles";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  // Only owners and managers can update projects
  await requireRole(orgId, ["owner", "manager"]);
  
  // Your update logic here...
}
```

### Helper Functions

```typescript
import { getUser, getSession, getOrgMembership, requireRole, hasMinimumRole } from "@/lib/roles";

// Get current user
const user = await getUser();

// Get user's session
const session = await getSession();

// Get user's role in an organization
const membership = await getOrgMembership(orgId);
if (membership) {
  console.log(`User role: ${membership.role}`);
}

// Check minimum role (without throwing)
const canManage = await hasMinimumRole(orgId, "manager");
```

## Client-Side Usage

### Basic Permission Check

```typescript
"use client";
import { useCan } from "@/lib/useRoleHelpers";

function MyComponent({ userRole }: { userRole: OrgRole }) {
  const canEdit = useCan("member", userRole);
  
  return (
    <div>
      {canEdit && <button>Edit</button>}
    </div>
  );
}
```

### Role Helpers Hook

```typescript
"use client";
import { useRoleHelpers } from "@/lib/useRoleHelpers";

function ProjectCard({ userRole }: { userRole: OrgRole }) {
  const { canEdit, canManage, isOwner } = useRoleHelpers(userRole);
  
  return (
    <div>
      {canEdit && <button>Edit Project</button>}
      {canManage && <button>Manage Team</button>}
      {isOwner && <button>Delete Organization</button>}
    </div>
  );
}
```

### Example Component

See `components/project-actions.tsx` for a complete example of role-based UI rendering.

## Database Schema

### Tables

**`organizations`**
- Organization entities with unique slugs

**`org_members`**
- Links users to organizations with roles
- Unique constraint on `(org_id, user_id)`

**`projects`**
- Belongs to an organization via `org_id`
- Inherits permissions from org membership

### Migration

Apply the SQL migration at `sql/migrations/001_create_tables.sql` to create:
- `organizations` table
- `org_members` table (with role check constraint)
- `projects`, `tasks`, `meetings` tables (with org relationships)

## Permission Examples

### Creating a Project

```typescript
// POST /api/projects
// Requires: owner, manager, or member
await requireRole(orgId, ["owner", "manager", "member"]);
```

### Updating a Project

```typescript
// PATCH /api/projects/[id]
// Requires: owner or manager
await requireRole(orgId, ["owner", "manager"]);
```

### Deleting a Project

```typescript
// DELETE /api/projects/[id]
// Requires: owner or manager
await requireRole(orgId, ["owner", "manager"]);
```

## Error Responses

### 401 Unauthorized
User is not authenticated.

```json
{
  "error": "Unauthorized. Please log in."
}
```

### 403 Forbidden (Not a member)
User is not a member of the organization.

```json
{
  "error": "Forbidden. You are not a member of this organization."
}
```

### 403 Forbidden (Insufficient permissions)
User lacks the required role.

```json
{
  "error": "Forbidden. Insufficient permissions.",
  "requiredRoles": ["owner", "manager"],
  "yourRole": "member"
}
```

## Best Practices

1. **Server-side enforcement**: Always check permissions on the server. Client-side checks are for UX only.

2. **Use `requireRole` in API routes**: Throws appropriate errors automatically.

3. **Check org_id from resources**: Always fetch the resource first to get its `org_id`, then check membership.

4. **Provide clear error messages**: Include required roles and user's current role in 403 responses.

5. **Use role helpers for UI**: Hide buttons/features users can't access for better UX.

## Testing

```typescript
// Test helpers (for unit tests)
import { RoleRank, hasRoleRank } from "@/types/roles";

describe("Role permissions", () => {
  it("should allow manager to access member resources", () => {
    expect(hasRoleRank("manager", "member")).toBe(true);
  });
  
  it("should not allow viewer to access manager resources", () => {
    expect(hasRoleRank("viewer", "manager")).toBe(false);
  });
});
```
