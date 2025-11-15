# Role-Based Code Organization Plan

## Current Issues
- Patient-specific components are in generic folders (`dashboard/`, `layout/`)
- No clear separation between role-specific and shared components
- Hard to maintain and scale as features grow

## Proposed Structure

```
src/
├── components/
│   ├── patient/                    # Patient-specific components
│   │   ├── dashboard/              # Patient dashboard components
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── DashboardHero.tsx
│   │   │   ├── DentalHealthOverview.tsx
│   │   │   ├── MainActions.tsx
│   │   │   ├── NextAppointment.tsx
│   │   │   ├── StatsGrid.tsx
│   │   │   └── WelcomeSection.tsx
│   │   ├── layout/                 # Patient layout components
│   │   │   ├── PatientDashboardLayout.tsx
│   │   │   └── PatientSidebar.tsx
│   │   ├── appointments/          # Patient appointment components
│   │   │   ├── AppointmentCard.tsx
│   │   │   ├── AppointmentFilters.tsx
│   │   │   ├── AppointmentSearch.tsx
│   │   │   ├── AppointmentsList.tsx
│   │   │   ├── AppointmentsTabs.tsx
│   │   │   ├── BookingConfirmationStep.tsx
│   │   │   ├── DoctorSelectionStep.tsx
│   │   │   ├── ProgressSteps.tsx
│   │   │   └── TimeSelectionStep.tsx
│   │   └── voice/                  # Patient voice assistant
│   │       ├── FeatureCards.tsx
│   │       ├── VapiWidget.tsx
│   │       └── WelcomeSection.tsx
│   ├── doctor/                     # Doctor-specific components (already exists)
│   │   ├── AppointmentTypesSettings.tsx
│   │   ├── AvailabilitySettings.tsx
│   │   └── WorkingHoursSettings.tsx
│   ├── admin/                      # Admin-specific components (already exists)
│   │   ├── AddDoctorDialog.tsx
│   │   ├── AdminStats.tsx
│   │   ├── DoctorsManagement.tsx
│   │   ├── DoctorVerifications.tsx
│   │   ├── EditDoctorDialog.tsx
│   │   └── RecentAppointments.tsx
│   ├── shared/                     # Shared components across roles
│   │   ├── appointments/           # Shared appointment components
│   │   │   ├── AppointmentConfirmationModal.tsx
│   │   │   ├── DoctorCardsLoading.tsx
│   │   │   └── DoctorInfo.tsx
│   │   └── layout/                 # Shared layout components
│   │       └── RoleBasedLayout.tsx (wrapper that selects layout by role)
│   ├── navbar/                     # Role-specific navbars (keep as is)
│   │   ├── AdminNavbar.tsx
│   │   ├── DoctorNavbar.tsx
│   │   └── PatientNavbar.tsx
│   └── ui/                         # Shared UI components (keep as is)
│       └── ...
├── app/
│   ├── dashboard/                  # Patient dashboard (keep as is)
│   ├── appointments/               # Patient appointments (keep as is)
│   ├── voice/                      # Patient voice (keep as is)
│   ├── doctor/                     # Doctor routes (keep as is)
│   └── admin/                      # Admin routes (keep as is)
```

## Migration Steps

1. **Create patient folder structure**
2. **Move patient-specific components**
3. **Create shared folder for common components**
4. **Update imports across the codebase**
5. **Create role-based layout wrapper**
6. **Update pages to use new structure**

## Benefits

- ✅ Clear separation of concerns
- ✅ Easy to find role-specific code
- ✅ Better scalability
- ✅ Easier maintenance
- ✅ Prevents accidental cross-role usage
- ✅ Better code organization

