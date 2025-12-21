import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import UserSync from "@/components/UserSync";
import TanStackProvider from "@/components/providers/TanStackProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Medibook - Doctor Appointment Booking Platform",
  description:
    "Book doctor appointments instantly. Get instant healthcare assistance through voice calls with our AI assistant. Available 24/7.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TanStackProvider>
            <ClerkProvider
              appearance={{
                variables: {
                  colorPrimary: "#e78a53",
                },
                elements: {
                  rootBox: "dark:bg-background",
                  card: "dark:bg-card dark:text-card-foreground",
                  headerTitle: "dark:text-foreground",
                  headerSubtitle: "dark:text-muted-foreground",
                  socialButtonsBlockButton: "dark:bg-input dark:text-foreground dark:hover:bg-accent",
                  formButtonPrimary: "dark:bg-primary dark:text-primary-foreground",
                  formFieldInput: "dark:bg-input dark:text-foreground dark:border-border",
                  footerActionLink: "dark:text-primary",
                },
              }}
            >
              <Toaster />
              <UserSync />
              {children}
            </ClerkProvider>
          </TanStackProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
