"use client";

// TODO: Create OnboardingTour component or remove this import
// import { OnboardingTour } from "@/components/shared/OnboardingTour";

const PATIENT_TOUR_STEPS = [
  {
    id: "welcome",
    title: "Welcome to Medibook! 👋",
    description:
      "Your personal healthcare assistant is here to help. Let's explore your dashboard together.",
    position: "center" as const,
  },
  {
    id: "stats",
    title: "Your Overview 📊",
    description:
      "Here you can see your appointment statistics at a glance - total appointments, upcoming visits, and completed sessions.",
    target: '[data-tour="stats-grid"]',
    position: "bottom" as const,
  },
  {
    id: "quick-actions",
    title: "Quick Actions ⚡",
    description:
      "Start a voice call with our AI assistant or book an appointment with a verified doctor. Everything you need is just a click away.",
    target: '[data-tour="quick-actions"]',
    position: "bottom" as const,
  },
  {
    id: "appointments",
    title: "Your Appointments 📅",
    description:
      "View your next appointment details and manage all your scheduled visits. You can see dates, times, and doctor information here.",
    target: '[data-tour="appointments"]',
    position: "bottom" as const,
  },
  {
    id: "activity",
    title: "Recent Activity 📋",
    description:
      "Keep track of your latest appointments and interactions. This feed shows your recent healthcare activities.",
    target: '[data-tour="activity"]',
    position: "top" as const,
  },
];

export function PatientOnboardingTour() {
  // TODO: Implement OnboardingTour component
  return null;
  // return (
  //   <OnboardingTour
  //     tourId="patient-dashboard"
  //     steps={PATIENT_TOUR_STEPS}
  //     onComplete={() => {
  //       console.log("Patient onboarding tour completed");
  //     }}
  //   />
  // );
}
