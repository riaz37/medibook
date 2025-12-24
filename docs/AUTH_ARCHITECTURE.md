# Production-Grade Authentication Architecture

## Overview

This document describes the complete authentication and authorization architecture for the Medibook application. The system uses **Custom JWT-based Authentication** with **Prisma Database** as the single source of truth for roles and user data.

## Core Principles

1. **Database is the Single Source of Truth**: All user data and role information is stored in the database
2. **JWT Sessions**: Secure, HTTP-only cookies with JWT tokens for session management
3. **Defense in Depth**: Multiple layers of protection (middleware, route handlers, business logic)
4. **RBAC System**: Role-based and permission-based access control

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  - useCurrentUser() hook (custom)                            │
│  - useRole() hook (custom)                                   │
│  - Client-side role checks (UI only, not security)           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE LAYER                          │
│  - middleware.ts (JWT verification)                          │
│  - Route protection (public/private)                        │
│  - Role-based route access                                  │
│  - JWT token validation                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API ROUTE LAYER                           │
│  - getAuthContext() - Primary auth utility                  │
│  - requireAuth() - Require authentication                   │
│  - requireRole() - Require specific role                    │
│  - requirePermission() - Permission-based checks            │
│  - Database lookups for user and role data                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                             │
│  - User table (id, email, passwordHash, etc.)               │
│  - Role table (patient, doctor, admin)                      │
│  - Permission table (resource-action pairs)                 │
│  - Session table (active sessions)                          │
│  - RoleChangeAudit table (audit trail)                      │
└─────────────────────────────────────────────────────────────┘
```

## Authentication Flow

### 1. User Sign-Up
```
User → POST /api/auth/sign-up
  ↓
Validate input (email, password, name, role)
  ↓
Hash password with bcryptjs
  ↓
Create User in Database
  ↓
Assign role (patient/doctor/admin)
  ↓
Create session with JWT token
  ↓
Set HTTP-only session cookie
```

### 2. User Sign-In
```
User → POST /api/auth/sign-in
  ↓
Validate email and password
  ↓
Verify password hash
  ↓
Create session with JWT token
  ↓
Set HTTP-only session cookie
  ↓
Return user data (without sensitive info)
```

### 3. Request Authentication
```
Request → Middleware (middleware.ts)
  ├─ Check if authenticated (session cookie exists)
  ├─ Verify JWT token
  ├─ Extract role from token
  └─ Protect routes based on role
       ↓
API Route Handler
  ├─ getAuthContext() or requireAuth()
  ├─ Query database for user data
  ├─ Verify role and permissions
  └─ Return auth context
```

## Key Components

### 1. `lib/auth.ts` - Authentication Utilities

**Functions**:
- `hashPassword(password)` - Hash password with bcrypt
- `verifyPassword(password, hash)` - Verify password
- `createSession(userId)` - Create JWT session
- `getSession()` - Get current session from cookie
- `deleteSession()` - Logout (delete session)
- `getCurrentUser()` - Get authenticated user

### 2. `lib/jwt.ts` - JWT Token Management

**Functions**:
- `signToken(payload, expiresIn)` - Create JWT token
- `verifyToken(token)` - Verify and decode JWT token

### 3. `lib/server/rbac.ts` - RBAC System

**Features**:
- ✅ Role-based access control
- ✅ Permission-based access control
- ✅ Resource ownership checks
- ✅ Database as source of truth

**Functions**:
- `getAuthContext(includeDbUser?)` - Get full auth context
- `requireAuth()` - Require authentication
- `requireRole(role)` - Require specific role
- `requireAnyRole(roles[])` - Require any of specified roles
- `requirePermission(resource, action)` - Require permission
- `checkPermission(resource, action)` - Check if user has permission
- `requireDoctorOwnership(doctorId)` - Verify doctor owns resource
- `requireAppointmentAccess(appointmentId)` - Verify access to appointment

### 4. Custom React Hooks

**`useCurrentUser()`** - Get authenticated user
```typescript
const { user, isLoaded, isSignedIn } = useCurrentUser();
```

**`useRole()`** - Get user's role
```typescript
const role = useRole(); // "patient" | "doctor" | "admin" | null
```

## Role Management

### Role Sources (Priority Order)
1. **Database** (`User.role` relation) - Primary source
2. **Legacy Enum** (`User.userRole`) - Backward compatibility

### Role Updates
All role changes:
1. Update database first
2. Log to RoleChangeAudit table
3. Create new session with updated role

**Places where roles are updated**:
- Signup (`/api/auth/sign-up`)
- Admin role change (`/api/admin/users/[id]/role`)
- Doctor application approval (`/api/admin/doctors/applications/[id]`)

## Security Best Practices

### ✅ Implemented
- Database as source of truth
- Secure password hashing with bcrypt (12 rounds)
- HTTP-only session cookies
- JWT token expiration (7 days)
- Session validation in database
- Role change audit trail
- Admin role protection (can't be demoted)
- RBAC with granular permissions

### 🔒 Security Measures
1. **Password Security**:
   - Minimum 8 characters required
   - Bcrypt hashing with salt rounds of 12
   - Passwords never stored in plain text

2. **Session Security**:
   - HTTP-only cookies (not accessible via JavaScript)
   - Secure flag in production
   - SameSite=Lax for CSRF protection
   - 7-day expiration

3. **JWT Security**:
   - Signed with secret key (HS256)
   - Contains minimal payload (userId, role)
   - Verified on every request

## Common Patterns

### Pattern 1: Simple Auth Check
```typescript
const context = await getAuthContext();
if (!context) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
// Use context.userId, context.role
```

### Pattern 2: Role-Based Access
```typescript
const authResult = await requireRole("admin");
if ("response" in authResult) {
  return authResult.response;
}
const { context } = authResult;
```

### Pattern 3: Permission-Based Access
```typescript
const permissionCheck = await requirePermission("appointments", "read");
if ("response" in permissionCheck) {
  return permissionCheck.response;
}
const { context } = permissionCheck;
```

### Pattern 4: Ownership Check
```typescript
const authResult = await requireDoctorOwnership(doctorId);
if ("response" in authResult) {
  return authResult.response;
}
const { context } = authResult;
```

## Error Handling

### Authentication Errors
- **401 Unauthorized**: User not authenticated
- **403 Forbidden**: User authenticated but lacks permission/role

### Error Responses
```typescript
// Consistent error format
{
  error: "Unauthorized" | "Forbidden",
  reason?: string // Optional detailed reason
}
```

## Testing Checklist

- [x] User can sign up with email and password
- [x] User can sign in with credentials
- [x] User can log out
- [x] Session persists across page refreshes
- [x] Session expires after 7 days
- [x] Role changes are logged
- [x] Admin routes are protected
- [x] Doctor routes are protected
- [x] Patient routes are protected
- [x] Admin cannot be demoted
- [x] RBAC permissions work correctly

## Performance Considerations

### Session Management
- JWT verification: ~1-5ms
- Database session lookup: ~10-50ms
- Session is verified once per request

### Optimization Tips
1. Cache user role in JWT payload
2. Use `includeDbUser` only when needed
3. Batch permission checks when possible
4. Consider Redis for session storage (future improvement)

## Monitoring & Observability

### Key Metrics to Track
- Authentication success/failure rates
- Session creation/expiration
- Role change events
- Permission denied events
- Password reset requests

### Logging
- All authentication failures logged
- Role changes logged to RoleChangeAudit
- Failed login attempts tracked

## Future Improvements

1. **Redis Caching**: Cache sessions and role lookups
2. **Rate Limiting**: Add rate limiting to auth endpoints
3. **Multi-Factor Auth**: Add MFA support
4. **Password Reset**: Email-based password reset flow
5. **Email Verification**: Verify email addresses on signup
6. **Refresh Tokens**: Implement refresh token rotation

## Summary

The authentication system is **production-ready** with:
- ✅ Custom JWT-based authentication
- ✅ Secure password hashing
- ✅ HTTP-only session cookies
- ✅ Database as single source of truth
- ✅ Comprehensive RBAC system
- ✅ Audit trail for role changes
- ✅ Multiple security layers

The system provides a secure, scalable foundation for authentication and authorization without external dependencies.
