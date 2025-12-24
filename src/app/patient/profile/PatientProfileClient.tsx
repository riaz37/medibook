"use client";

import { useEffect } from "react";
import { useUser } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Save, User as UserIcon, Mail, Phone, CheckCircle2 } from "lucide-react";
import { usersService } from "@/lib/services";
import { FormFieldEnhanced } from "@/components/ui/form-field-enhanced";
import type { User } from "@/lib/types";
import { PageLoading } from "@/components/ui/loading-skeleton";
import { showSuccess, showError, handleApiError, toastMessages } from "@/lib/utils/toast";
import { userProfileFormSchema, type UserProfileFormInput } from "@/lib/validations/user.schema";
import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

export default function PatientProfileClient() {
  const { user: authUser } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<UserProfileFormInput>({
    resolver: zodResolver(userProfileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
    },
    mode: "onBlur", // Validate on blur for better UX
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await usersService.getProfile();
      if (profile) {
        setUser(profile);
        form.reset({
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          phone: profile.phone || "",
          email: profile.email || "",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      showError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: UserProfileFormInput) => {
    try {
      const updatedUser = await usersService.updateProfile({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone?.trim() || null,
      });

      setUser(updatedUser);
      showSuccess(toastMessages.success.profileUpdated);
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage = handleApiError(error, toastMessages.error.profileUpdateFailed);
      showError(errorMessage);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <PageLoading message="Loading profile..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="size-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field, fieldState }) => (
                  <FormFieldEnhanced
                    label="First Name"
                    required
                    error={fieldState.error}
                    touched={fieldState.isTouched}
                    isValid={!fieldState.error && fieldState.isTouched}
                  >
                    <Input
                      placeholder="Enter your first name"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormFieldEnhanced>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field, fieldState }) => (
                  <FormFieldEnhanced
                    label="Last Name"
                    required
                    error={fieldState.error}
                    touched={fieldState.isTouched}
                    isValid={!fieldState.error && fieldState.isTouched}
                  >
                    <Input
                      placeholder="Enter your last name"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormFieldEnhanced>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      disabled
                      className="bg-muted cursor-not-allowed"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Email cannot be changed. Contact support if you need to update your email.
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field, fieldState }) => (
                <FormFieldEnhanced
                  label={
                    <span className="flex items-center gap-2">
                      <Phone className="size-4 text-muted-foreground" />
                      Phone Number
                    </span>
                  }
                  description="Optional. Include country code for international numbers."
                  error={fieldState.error}
                  touched={fieldState.isTouched}
                  isValid={!fieldState.error && fieldState.isTouched && !!field.value}
                >
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    disabled={form.formState.isSubmitting}
                    {...field}
                    value={field.value || ""}
                  />
                </FormFieldEnhanced>
              )}
            />

            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full md:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Account Created</p>
                <p className="font-medium">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Last Updated</p>
                <p className="font-medium">
                  {user?.updatedAt
                    ? new Date(user.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </p>
              </div>
            </div>

            {authUser && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Your account is securely managed. Contact support if you need to update your
                  email address.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
