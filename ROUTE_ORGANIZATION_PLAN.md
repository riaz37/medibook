# Route Organization Plan

## Current Structure (Inconsistent)

```
/                    # Landing page
/dashboard           # Patient dashboard (root level)
/appointments        # Patient appointments (root level)
/appointments/book   # Patient booking (root level)
/appointments/[id]   # Patient appointment details (root level)
/voice               # Patient voice assistant (root level)
/doctor/dashboard    # Doctor dashboard (organized)
/doctor/setup        # Doctor setup (organized)
/admin               # Admin dashboard (organized)
```

## Problem

- **Inconsistent**: Patient routes at root, doctor/admin under role prefix
- **Unclear ownership**: Hard to tell which routes belong to which role
- **Scalability issues**: Adding new patient features clutters root level
- **Maintenance**: Harder to organize and protect routes

## Proposed Structure (Consistent)

```
/                    # Landing page
/select-role         # Role selection (shared)

/patient/            # Patient routes (organized)
  /dashboard         # Patient dashboard
  /appointments      # Patient appointments list
  /appointments/book # Patient booking
  /appointments/[id] # Patient appointment details
  /voice             # Patient voice assistant

/doctor/             # Doctor routes (already organized)
  /dashboard         # Doctor dashboard
  /setup             # Doctor setup
  /settings          # Doctor settings

/admin/              # Admin routes (already organized)
  /                  # Admin dashboard
```

## Benefits

1. **Consistency**: All roles follow same pattern
2. **Clarity**: Easy to see which routes belong to which role
3. **Scalability**: Easy to add new role-specific routes
4. **Maintenance**: Easier to organize and protect routes
5. **Middleware**: Simpler route matching patterns

## Migration Strategy

### Option 1: Full Migration (Recommended)
- Move all patient routes to `/patient/`
- Add redirects from old routes to new routes
- Update all internal links
- Update middleware

**Pros**: Clean, consistent structure
**Cons**: Breaking change (but with redirects)

### Option 2: Gradual Migration
- Keep existing routes working
- Add new routes under `/patient/`
- Gradually migrate users
- Remove old routes later

**Pros**: No breaking changes
**Cons**: Temporary duplication

## Implementation Plan

### Phase 1: Create New Structure
1. Create `/patient/` folder structure
2. Move/copy patient pages to new location
3. Update imports and components

### Phase 2: Add Redirects
1. Create redirect pages at old routes
2. Redirect to new routes
3. Preserve query parameters

### Phase 3: Update Links
1. Update all internal navigation links
2. Update sidebar navigation
3. Update breadcrumbs
4. Update any hardcoded URLs

### Phase 4: Update Middleware
1. Update route matchers
2. Add patient route protection
3. Test all route protections

### Phase 5: Cleanup
1. Remove old route files (after redirects confirmed)
2. Update documentation
3. Update any external references

## Route Protection Patterns

### Current Middleware
```typescript
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isDoctorRoute = createRouteMatcher(["/doctor(.*)"]);
// Patient routes not explicitly protected
```

### Proposed Middleware
```typescript
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isDoctorRoute = createRouteMatcher(["/doctor(.*)"]);
const isPatientRoute = createRouteMatcher(["/patient(.*)"]);
```

## Redirect Implementation

For each old route, create a redirect page:

```typescript
// app/dashboard/page.tsx
import { redirect } from "next/navigation";

export default function DashboardRedirect() {
  redirect("/patient/dashboard");
}
```

## File Structure After Migration

```
src/app/
├── (public)/              # Public routes
│   ├── page.tsx          # Landing
│   └── select-role/
│
├── patient/               # Patient routes
│   ├── dashboard/
│   │   └── page.tsx
│   ├── appointments/
│   │   ├── page.tsx
│   │   ├── book/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   └── voice/
│       └── page.tsx
│
├── doctor/               # Doctor routes (existing)
│   ├── dashboard/
│   ├── setup/
│   └── settings/
│
├── admin/                # Admin routes (existing)
│   └── page.tsx
│
└── api/                  # API routes (keep as is)
```

## Recommendation

**Go with Option 1 (Full Migration)** because:
- Cleaner codebase
- Better long-term maintainability
- Consistent with doctor/admin routes
- Redirects prevent breaking changes
- One-time effort, permanent benefit

## Next Steps

1. Review and approve this plan
2. Create new route structure
3. Implement redirects
4. Update all links
5. Update middleware
6. Test thoroughly
7. Deploy

