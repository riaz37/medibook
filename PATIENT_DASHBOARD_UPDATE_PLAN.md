# Patient Dashboard & Appointments Management Update Plan

## Overview
Reorganize the appointments system into a dedicated management interface and update the patient dashboard with better organization and navigation.

---

## Phase 1: Clean Up Booking Page

### Task 1.1: Remove Appointments Display from Booking Page
**File:** `src/app/appointments/page.tsx`
- Remove lines 210-240 (the "Your Upcoming Appointments" section)
- Keep only the booking flow (steps 1-3)
- This page will become `/appointments/book` later

---

## Phase 2: Create New Route Structure

### Task 2.1: Reorganize Routes
Create new directory structure:
```
src/app/appointments/
├── page.tsx (Main appointments management hub)
├── book/
│   └── page.tsx (Move current booking flow here)
├── upcoming/
│   └── page.tsx (Upcoming appointments view)
├── completed/
│   └── page.tsx (Completed appointments view)
└── [id]/
    └── page.tsx (Individual appointment details)
```

### Task 2.2: Create Main Appointments Hub
**File:** `src/app/appointments/page.tsx`
- Tab-based navigation: All | Upcoming | Completed | Book New
- Quick stats cards: Total, Upcoming, Completed
- Recent appointments preview
- Link to book new appointment

---

## Phase 3: Create Reusable Components

### Task 3.1: AppointmentsList Component
**File:** `src/components/appointments/AppointmentsList.tsx`
- Props: `appointments`, `filter` (upcoming/completed/all), `onCancel`, `onReschedule`
- Filtering logic based on date and status
- Empty states for each filter
- Loading states

### Task 3.2: AppointmentCard Component
**File:** `src/components/appointments/AppointmentCard.tsx`
- Display: Doctor image, name, specialty
- Date and time with formatting
- Status badge (CONFIRMED, COMPLETED, CANCELLED)
- Action buttons: Cancel (for upcoming), View Details
- Responsive design

### Task 3.3: AppointmentsTabs Component
**File:** `src/components/appointments/AppointmentsTabs.tsx`
- Tab navigation: All | Upcoming | Completed | Book New
- Active tab highlighting
- Tab counts (badges)

### Task 3.4: AppointmentDetailsModal Component
**File:** `src/components/appointments/AppointmentDetailsModal.tsx`
- Full appointment details view
- Doctor information
- Appointment type, duration, price
- Cancel/Reschedule actions
- View in calendar option

---

## Phase 4: Update Patient Dashboard

### Task 4.1: Create AppointmentsOverview Component
**File:** `src/components/dashboard/AppointmentsOverview.tsx`
- Quick stats: Upcoming count, Completed count, Total
- Next appointment preview (keep existing NextAppointment component)
- Quick actions: View All, Book New
- Link to appointments management

### Task 4.2: Update MainActions Component
**File:** `src/components/dashboard/MainActions.tsx`
- Update "Book Appointment" link to `/appointments/book`
- Keep existing design and functionality

### Task 4.3: Update ActivityOverview Component
**File:** `src/components/dashboard/ActivityOverview.tsx`
- Add AppointmentsOverview component
- Reorganize layout if needed
- Keep existing NextAppointment component

### Task 4.4: Update Dashboard Page
**File:** `src/app/dashboard/page.tsx`
- Add AppointmentsOverview to the layout
- Ensure proper spacing and organization

---

## Phase 5: API & Functionality

### Task 5.1: Create Cancel Appointment API (if needed)
**File:** `src/app/api/appointments/[id]/cancel/route.ts`
- PATCH endpoint to cancel appointments
- Validation: only upcoming appointments can be canceled
- Update status to CANCELLED
- Return updated appointment

### Task 5.2: Update Appointments Hook
**File:** `src/hooks/use-appointment.ts`
- Add `useCancelAppointment` hook
- Add filtering utilities
- Add sorting utilities

### Task 5.3: Create Appointments Service Methods
**File:** `src/lib/services/appointments.service.ts`
- Add `cancelAppointment(id)` method
- Add `getUpcomingAppointments()` method
- Add `getCompletedAppointments()` method
- Add filtering and sorting helpers

---

## Phase 6: Navigation Updates

### Task 6.1: Update PatientNavbar
**File:** `src/components/navbar/PatientNavbar.tsx`
- Add "Appointments" link to navigation
- Link to `/appointments` (main hub)
- Add active state styling

### Task 6.2: Update Dashboard Links
- Update all "Book Appointment" links to `/appointments/book`
- Update "View Appointments" links to `/appointments`

---

## Phase 7: Features & Enhancements

### Task 7.1: Appointment Filtering
- Filter by status (CONFIRMED, COMPLETED, CANCELLED)
- Filter by date range
- Filter by doctor
- Search functionality

### Task 7.2: Appointment Sorting
- Sort by date (ascending/descending)
- Sort by doctor name
- Sort by status

### Task 7.3: Empty States
- No upcoming appointments
- No completed appointments
- No appointments at all
- Each with appropriate CTAs

### Task 7.4: Loading States
- Skeleton loaders for appointment lists
- Loading states for actions (cancel, etc.)

---

## Phase 8: UI/UX Improvements

### Task 8.1: Status Badges
- Color-coded status badges
- CONFIRMED: Blue/Green
- COMPLETED: Gray
- CANCELLED: Red

### Task 8.2: Responsive Design
- Mobile-friendly appointment cards
- Responsive tabs
- Touch-friendly action buttons

### Task 8.3: Animations & Transitions
- Smooth tab transitions
- Card hover effects
- Loading animations

---

## Implementation Order

1. **Phase 1** - Clean up booking page (quick win)
2. **Phase 3** - Create reusable components (foundation)
3. **Phase 2** - Create new route structure
4. **Phase 5** - API & functionality (backend support)
5. **Phase 4** - Update dashboard (user-facing)
6. **Phase 6** - Navigation updates (connect everything)
7. **Phase 7** - Features & enhancements (polish)
8. **Phase 8** - UI/UX improvements (final touches)

---

## File Structure After Implementation

```
src/
├── app/
│   ├── appointments/
│   │   ├── page.tsx (Main hub)
│   │   ├── book/
│   │   │   └── page.tsx (Booking flow)
│   │   ├── upcoming/
│   │   │   └── page.tsx
│   │   ├── completed/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   └── dashboard/
│       └── page.tsx
├── components/
│   ├── appointments/
│   │   ├── AppointmentsList.tsx
│   │   ├── AppointmentCard.tsx
│   │   ├── AppointmentsTabs.tsx
│   │   └── AppointmentDetailsModal.tsx
│   └── dashboard/
│       └── AppointmentsOverview.tsx
└── hooks/
    └── use-appointment.ts (updated)
```

---

## Notes

- Keep existing booking flow intact, just move it to `/appointments/book`
- Maintain backward compatibility where possible
- Use existing design system components
- Follow existing code patterns and conventions
- Ensure proper error handling and loading states
- Add proper TypeScript types for all new components

