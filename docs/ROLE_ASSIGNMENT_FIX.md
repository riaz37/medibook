# Role Assignment Fix - Doctor Signup Issue

## Problem
Users signing up via `/sign-up/doctor` were being assigned `PATIENT` role instead of `DOCTOR` role.

## Root Cause
The webhook handler was checking for `signupIntent` in Clerk metadata, but:
1. The webhook fires **before** the client component sets the signup intent
2. The webhook defaulted to `PATIENT` when `signupIntent` was not found
3. The `user.updated` event wasn't properly handling role updates when signupIntent was set later

## Solution
Updated all role assignment points to:
1. Check `signupIntent` from Clerk metadata
2. Assign `DOCTOR` role when `signupIntent === "doctor"`
3. Handle both `user.created` and `user.updated` events properly
4. Update role when signupIntent is set after initial signup

## Files Fixed

### 1. Webhook Handler (`src/app/api/webhooks/clerk/route.ts`)
**Changes**:
- Check `signupIntent` from Clerk metadata
- Assign `DOCTOR` role when `signupIntent === "doctor"`
- Handle `user.updated` event to update role when signupIntent is set later
- Sync metadata when doctor intent is detected

**Key Logic**:
```typescript
let assignedRole: "ADMIN" | "PATIENT" | "DOCTOR";
if (isAdminEmail) {
  assignedRole = "ADMIN";
} else if (signupIntent === "doctor") {
  assignedRole = "DOCTOR";  // ✅ Now assigns DOCTOR
} else {
  assignedRole = "PATIENT";
}
```

### 2. Set Signup Intent API (`src/app/api/users/set-signup-intent/route.ts`)
**Changes**:
- When `intent === "doctor"`, immediately update database role to `DOCTOR`
- Update Clerk metadata with `role: "doctor"`
- Handle both patient and doctor intents

**Key Logic**:
```typescript
if (intent === "doctor" && (!currentMetadata.role || currentMetadata.role === "patient")) {
  updatedMetadata.role = "doctor";
  // Update database role to DOCTOR
  await prisma.user.update({
    where: { clerkId: userId },
    data: { role: "DOCTOR" },
  });
}
```

### 3. Sync Function (`src/lib/server/users.ts`)
**Changes**:
- Check `signupIntent` from Clerk metadata before assigning role
- Assign `DOCTOR` role when `signupIntent === "doctor"`
- Update role in database if signupIntent is doctor and user is still PATIENT

**Key Logic**:
```typescript
// Get signup intent from Clerk metadata
const signupIntent = existingMetadata?.signupIntent;

// Determine role based on signup intent
let assignedRole: "ADMIN" | "PATIENT" | "DOCTOR";
if (isAdminEmail) {
  assignedRole = "ADMIN";
} else if (signupIntent === "doctor") {
  assignedRole = "DOCTOR";  // ✅ Now assigns DOCTOR
} else {
  assignedRole = "PATIENT";
}
```

### 4. Service Layer (`src/lib/services/server/users.service.ts`)
**Changes**:
- Updated `syncFromClerk()` to check signup intent
- Assign `DOCTOR` role when `signupIntent === "doctor"`

## Role Assignment Flow

### Patient Signup (`/sign-up/patient`)
```
1. User signs up → Clerk creates user
2. Webhook fires (user.created) → signupIntent not set yet → assigns PATIENT
3. Client sets signupIntent="patient" → API updates metadata
4. Result: role = PATIENT ✅
```

### Doctor Signup (`/sign-up/doctor`)
```
1. User signs up → Clerk creates user
2. Webhook fires (user.created) → signupIntent not set yet → assigns PATIENT (temporary)
3. Client sets signupIntent="doctor" → API:
   - Updates metadata with signupIntent="doctor"
   - Updates database role to DOCTOR
   - Updates Clerk metadata with role="doctor"
4. Webhook fires (user.updated) → detects signupIntent="doctor" → ensures role is DOCTOR
5. Result: role = DOCTOR ✅
```

## Testing

### Test Patient Signup
1. Go to `/sign-up/patient`
2. Complete signup
3. Check database: `role = PATIENT` ✅
4. Check Clerk metadata: `signupIntent = "patient"`, `role = "patient"` ✅

### Test Doctor Signup
1. Go to `/sign-up/doctor`
2. Complete signup
3. Check database: `role = DOCTOR` ✅
4. Check Clerk metadata: `signupIntent = "doctor"`, `role = "doctor"` ✅

## Edge Cases Handled

1. **Race Condition**: Webhook fires before signupIntent is set
   - Solution: `set-signup-intent` API updates role immediately
   - `user.updated` event also handles role update

2. **Late Intent Setting**: SignupIntent set after webhook
   - Solution: `user.updated` event checks signupIntent and updates role

3. **Sync Function Fallback**: UserSync component syncs user
   - Solution: Sync function checks signupIntent and assigns correct role

4. **Service Layer**: Other services using `syncFromClerk`
   - Solution: Service layer also checks signupIntent

## Summary

All role assignment points now correctly handle signup intent:
- ✅ Webhook handler
- ✅ Set signup intent API
- ✅ Sync function
- ✅ Service layer

Doctors signing up via `/sign-up/doctor` now get `DOCTOR` role immediately, not `PATIENT`.
