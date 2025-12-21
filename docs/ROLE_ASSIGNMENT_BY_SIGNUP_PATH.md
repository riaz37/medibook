# Role Assignment Based on Signup Path

## Overview

Users now get roles assigned based on which signup path they use:
- `/sign-up/patient` → `PATIENT` role
- `/sign-up/doctor` → `PATIENT` role (with doctor intent tracked)

## Implementation Details

### 1. Catch-All Routes (Fixed Clerk Routing Issue)

**Problem**: Clerk's `<SignUp/>` component requires catch-all routes for path-based routing.

**Solution**: Converted signup pages to catch-all routes:
- `/sign-up/patient/[[...rest]]]/page.tsx`
- `/sign-up/doctor/[[...rest]]]/page.tsx`

This allows Clerk to handle all sub-routes like `/sign-up/patient/verify-email`, etc.

### 2. Signup Intent Tracking

**Component**: `src/components/signup/SignupIntentSetter.tsx`

This client component:
- Detects when user completes signup
- Calls `/api/users/set-signup-intent` to store intent in Clerk metadata
- Only sets intent if user doesn't have a role yet (new signup)

**API Route**: `src/app/api/users/set-signup-intent/route.ts`

Sets `signupIntent: "patient"` or `signupIntent: "doctor"` in Clerk's `publicMetadata`.

### 3. Webhook Role Assignment

**File**: `src/app/api/webhooks/clerk/route.ts`

Updated to:
- Check for `signupIntent` in Clerk metadata
- Assign `PATIENT` role for both patient and doctor signups
- Preserve `signupIntent` in metadata for tracking

**Flow**:
```
User Signs Up → Webhook fires (user.created)
  ↓
Check: signupIntent in metadata?
  ├─ Yes → Use it (but still assign PATIENT for doctors)
  └─ No → Default to PATIENT
  ↓
Assign role: PATIENT (or ADMIN if email matches)
  ↓
Sync to Clerk metadata (preserve signupIntent)
```

### 4. Sync Function Updates

**File**: `src/lib/server/users.ts`

Updated `syncUserDirect()` to:
- Preserve `signupIntent` when syncing metadata
- Ensure intent is not lost during fallback syncs

## Role Assignment Rules

| Signup Path | Role Assigned | Intent Tracked |
|-------------|---------------|----------------|
| `/sign-up/patient` | `PATIENT` | `"patient"` |
| `/sign-up/doctor` | `PATIENT` | `"doctor"` |
| Admin email | `ADMIN` | N/A |

**Note**: Doctors still get `PATIENT` role initially and must apply to become `DOCTOR`. The `signupIntent` is tracked for:
- Faster application processing
- UI hints (showing application form immediately)
- Analytics

## Timing Considerations

There's a potential race condition:
1. User signs up → Webhook fires immediately (`user.created`)
2. Client component sets `signupIntent` after signup completes

**Handling**:
- Webhook checks for `signupIntent` if available (might not be set yet)
- If `signupIntent` is set later, `user.updated` event preserves it
- Both paths default to `PATIENT` anyway, so timing doesn't affect role assignment

## Files Changed

1. **Signup Pages** (catch-all routes):
   - `src/app/sign-up/patient/[[...rest]]]/page.tsx`
   - `src/app/sign-up/doctor/[[...rest]]]/page.tsx`

2. **New Components**:
   - `src/components/signup/SignupIntentSetter.tsx`

3. **New API Routes**:
   - `src/app/api/users/set-signup-intent/route.ts`

4. **Updated Files**:
   - `src/app/api/webhooks/clerk/route.ts` - Check signup intent
   - `src/lib/server/users.ts` - Preserve signup intent

## Testing

To test the implementation:

1. **Patient Signup**:
   - Go to `/sign-up/patient`
   - Complete signup
   - Check Clerk dashboard: `publicMetadata.signupIntent = "patient"`
   - Check database: `role = PATIENT`

2. **Doctor Signup**:
   - Go to `/sign-up/doctor`
   - Complete signup
   - Check Clerk dashboard: `publicMetadata.signupIntent = "doctor"`
   - Check database: `role = PATIENT` (must apply to become DOCTOR)

3. **Verify Routing**:
   - Clerk's internal routes (verify-email, etc.) should work
   - No "route not configured" errors

## Future Enhancements

Potential improvements:
1. **Auto-assign DOCTOR role**: If `signupIntent === "doctor"` and admin approves, auto-assign
2. **UI hints**: Show different onboarding based on `signupIntent`
3. **Analytics**: Track conversion rates by signup path
