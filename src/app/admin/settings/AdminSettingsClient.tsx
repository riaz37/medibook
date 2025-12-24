"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Info, Shield, Bell } from "lucide-react";

export default function AdminSettingsClient() {
  return (
    <div className="space-y-6">
      {/* System Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="size-5 text-primary" />
            System Information
          </CardTitle>
          <CardDescription>View system details and version information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Application Name</p>
              <p className="font-medium">Medibook</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Version</p>
              <p className="font-medium">1.0.0 (MVP)</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Environment</p>
              <p className="font-medium">{process.env.NODE_ENV || "development"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Status</p>
              <p className="font-medium text-green-600">Operational</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            Security Settings
          </CardTitle>
          <CardDescription>Manage security and access controls</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Security settings are managed through the authentication system. Advanced security features
              will be available in future updates.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Notification Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5 text-primary" />
            Notification Settings
          </CardTitle>
          <CardDescription>Configure system notifications and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Notification settings will be available in future updates. Currently, all system
              notifications are enabled by default.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* General Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5 text-primary" />
            General Settings
          </CardTitle>
          <CardDescription>Configure general application settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Feature Flags</p>
            <p className="text-sm text-muted-foreground">
              Feature flags and advanced configuration options will be available in future updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

