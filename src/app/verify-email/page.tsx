"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, XCircle, Mail, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const emailSent = searchParams.get("sent") === "true";

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [error, setError] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isDoctorPendingApproval, setIsDoctorPendingApproval] = useState(false);

  const checkDoctorStatus = async () => {
    try {
      // Check if user has doctor_pending role
      const userResponse = await fetch("/api/auth/me");
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.role === "doctor_pending") {
          setIsDoctorPendingApproval(true);
        }
      }
    } catch (err) {
      // Silently fail - not critical
      console.error("Failed to check doctor status:", err);
    }
  };

  useEffect(() => {
    const verifyEmail = async () => {
      // If email was just sent (from signup), don't try to verify
      if (emailSent) {
        setIsLoading(false);
        return;
      }

      if (!token) {
        setError("No verification token provided");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || errorData.message || "Verification failed";
          // Format validation errors if present
          if (errorData.details && errorData.details.length > 0) {
            const detailMessages = errorData.details.map((d: { field: string; message: string }) => d.message).join(", ");
            setError(`${errorMessage}. ${detailMessages}`);
          } else {
            setError(errorMessage);
          }
          return;
        }

        const data = await response.json();

        if (data.success) {
          if (data.alreadyVerified) {
            setAlreadyVerified(true);
            // Check if user is a doctor pending approval
            await checkDoctorStatus();
          } else {
            setIsSuccess(true);
            // Check if user is a doctor pending approval
            await checkDoctorStatus();
          }
        } else {
          setError(data.error || "Verification failed");
        }
      } catch (err) {
        setError("Failed to verify email");
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token, emailSent]);

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendSuccess(false);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        setResendSuccess(true);
      } else {
        setError(data.error || "Failed to resend verification email");
      }
    } catch (err) {
      setError("Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  // Show "Email Sent" message if user just signed up
  if (emailSent && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a verification email to your inbox. Please click the link in the email to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">What to do next?</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>1. Check your email inbox (and spam folder)</li>
                <li>2. Click the verification link in the email</li>
                <li>3. You'll be redirected back to complete your setup</li>
              </ul>
            </div>
            <Alert>
              <AlertDescription>
                Didn't receive the email? Check your spam folder or click below to resend.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              onClick={handleResendVerification}
              className="w-full"
              disabled={isResending || resendSuccess}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : resendSuccess ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Email Sent
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>
            <Link href="/sign-in" className="w-full">
              <Button variant="ghost" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verifying your email...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess || alreadyVerified) {
    // Show different message for doctors pending approval
    if (isDoctorPendingApproval) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <CheckCircle2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl">Email Verified!</CardTitle>
              <CardDescription>
                Your email address has been successfully verified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Pending Admin Approval</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Your doctor application is currently under review by our admin team. You'll receive an email notification once your application has been approved.
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>✓ Email verification complete</li>
                  <li>⏳ Admin approval pending</li>
                  <li>📧 You'll be notified via email when approved</li>
                </ul>
              </div>
              <Alert>
                <AlertDescription>
                  While waiting for approval, you can access the doctor dashboard with limited features. You'll gain full access once your application is approved.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Link href="/doctor/dashboard" className="w-full">
                <Button className="w-full">
                  Go to Doctor Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      );
    }

    // Normal success message for patients or approved doctors
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">
              {alreadyVerified ? "Already Verified" : "Email Verified!"}
            </CardTitle>
            <CardDescription>
              {alreadyVerified
                ? "Your email address has already been verified."
                : "Your email address has been successfully verified. You now have full access to Medibook."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">What&apos;s next?</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✓ Book appointments with doctors</li>
                <li>✓ Access your health records</li>
                <li>✓ Talk to our AI health assistant</li>
                <li>✓ Receive notifications and updates</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Link href="/patient/dashboard" className="w-full">
              <Button className="w-full">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/patient/appointments/book" className="w-full">
              <Button variant="outline" className="w-full">
                Book an Appointment
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Verification Failed</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resendSuccess ? (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                A new verification email has been sent. Please check your inbox.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertDescription>
                The verification link may have expired or is invalid. You can request a new verification email below.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            onClick={handleResendVerification}
            className="w-full"
            disabled={isResending || resendSuccess}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : resendSuccess ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Email Sent
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Resend Verification Email
              </>
            )}
          </Button>
          <Link href="/sign-in" className="w-full">
            <Button variant="ghost" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
