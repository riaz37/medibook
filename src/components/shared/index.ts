// Shared components barrel exports
export * from "./cards";
export * from "./forms";
export * from "./charts";

// Re-export existing shared components
export { DataTable } from "./DataTable";
export { DoctorCard } from "./DoctorCard";
export { PageHeader } from "./PageHeader";
export { ErrorBoundary } from "./ErrorBoundary";
export { showErrorToast } from "./ErrorToast";
export { NotificationCenter } from "./NotificationCenter";
export { OptimisticUpdate } from "./OptimisticUpdate";
export { ConfirmDialog } from "./ConfirmDialog";
export { UserButton } from "./UserButton";
export { DoctorSearchFilters } from "./DoctorSearchFilters";

// Re-export appointment-related components
export * from "./appointments";

