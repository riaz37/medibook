# VAPI Quota Implementation Example

This document provides code examples for implementing VAPI credit usage control.

## 1. Database Schema (Prisma)

Add to `prisma/schema.prisma`:

```prisma
model Subscription {
  id              String            @id @default(cuid())
  doctorId        String            @unique
  doctor          Doctor            @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  
  plan            SubscriptionPlan  @default(FREE)
  status          SubscriptionStatus @default(ACTIVE)
  
  currentPeriodStart DateTime       @default(now())
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean        @default(false)
  
  stripeCustomerId   String?        @unique
  stripeSubscriptionId String?      @unique
  
  vapiCallsUsed      Int            @default(0)
  vapiMinutesUsed    Int            @default(0)
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@map("subscriptions")
}

model VapiUsage {
  id            String   @id @default(cuid())
  doctorId      String
  doctor        Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  
  userId        String?
  user          User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  callId        String   @unique
  duration      Int      // seconds
  status        VapiCallStatus
  
  startedAt     DateTime @default(now())
  endedAt       DateTime?
  ipAddress     String?
  
  createdAt     DateTime @default(now())
  
  @@index([doctorId, startedAt])
  @@index([userId, startedAt])
  @@map("vapi_usage")
}

model UsageLimit {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  callsToday      Int      @default(0)
  minutesToday    Int      @default(0)
  lastCallAt      DateTime?
  lastCallIp      String?
  consecutiveCalls Int     @default(0)
  resetAt         DateTime
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("usage_limits")
}

enum SubscriptionPlan {
  FREE
  STARTER
  PROFESSIONAL
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  TRIALING
}

enum VapiCallStatus {
  INITIATED
  COMPLETED
  FAILED
  ABANDONED
}

// Update existing models
model Doctor {
  // ... existing fields
  subscription   Subscription?
  vapiUsage      VapiUsage[]
}

model User {
  // ... existing fields
  vapiUsage      VapiUsage[]
  usageLimit     UsageLimit?
}
```

## 2. Subscription Limits Configuration

Create `src/lib/config/subscription-limits.ts`:

```typescript
export const SUBSCRIPTION_LIMITS = {
  FREE: {
    calls: 5,
    minutesPerCall: 5 * 60, // 5 minutes in seconds
    totalMinutes: 25 * 60,
    appointments: 10,
  },
  STARTER: {
    calls: 50,
    minutesPerCall: 10 * 60,
    totalMinutes: 500 * 60,
    appointments: -1, // unlimited
  },
  PROFESSIONAL: {
    calls: 200,
    minutesPerCall: 15 * 60,
    totalMinutes: 3000 * 60,
    appointments: -1,
  },
  ENTERPRISE: {
    calls: 500,
    minutesPerCall: -1, // unlimited
    totalMinutes: -1,
    appointments: -1,
  },
} as const;

export const PATIENT_LIMITS = {
  FREE: {
    callsPerDay: 2,
    minutesPerCall: 5 * 60,
    callsPerHour: 1,
  },
  AUTHENTICATED: {
    callsPerDay: 10,
    minutesPerCall: 15 * 60,
    callsPerHour: 3,
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_LIMITS;
```

## 3. VAPI Usage Service

Create `src/lib/services/vapi-usage.service.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_LIMITS, PATIENT_LIMITS, type SubscriptionPlan } from "@/lib/config/subscription-limits";
import { SubscriptionStatus } from "@prisma/client";

export class VapiUsageService {
  /**
   * Check if doctor can make a VAPI call
   */
  async checkDoctorQuota(doctorId: string): Promise<{
    allowed: boolean;
    reason?: string;
    remainingCalls?: number;
    remainingMinutes?: number;
  }> {
    // Get doctor's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { doctorId },
      include: { doctor: true },
    });

    if (!subscription) {
      // No subscription = free tier
      return this.checkFreeTierQuota(doctorId);
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      return {
        allowed: false,
        reason: "Subscription is not active. Please update your subscription.",
      };
    }

    const limits = SUBSCRIPTION_LIMITS[subscription.plan as SubscriptionPlan];
    
    // Check call limit
    if (limits.calls !== -1 && subscription.vapiCallsUsed >= limits.calls) {
      return {
        allowed: false,
        reason: `Monthly call limit reached (${limits.calls} calls). Please upgrade your plan.`,
        remainingCalls: 0,
      };
    }

    // Check minute limit
    if (limits.totalMinutes !== -1 && subscription.vapiMinutesUsed >= limits.totalMinutes) {
      return {
        allowed: false,
        reason: `Monthly minute limit reached. Please upgrade your plan.`,
        remainingMinutes: 0,
      };
    }

    return {
      allowed: true,
      remainingCalls: limits.calls === -1 ? -1 : limits.calls - subscription.vapiCallsUsed,
      remainingMinutes: limits.totalMinutes === -1 ? -1 : limits.totalMinutes - subscription.vapiMinutesUsed,
    };
  }

  /**
   * Check if patient can make a VAPI call (rate limiting)
   */
  async checkPatientLimits(
    userId: string,
    ipAddress?: string
  ): Promise<{
    allowed: boolean;
    reason?: string;
    retryAfter?: number; // seconds
  }> {
    // Get or create usage limit record
    let usageLimit = await prisma.usageLimit.findUnique({
      where: { userId },
    });

    if (!usageLimit) {
      usageLimit = await prisma.usageLimit.create({
        data: {
          userId,
          resetAt: this.getNextResetTime(),
        },
      });
    }

    // Reset daily limits if needed
    if (new Date() >= usageLimit.resetAt) {
      usageLimit = await prisma.usageLimit.update({
        where: { userId },
        data: {
          callsToday: 0,
          minutesToday: 0,
          consecutiveCalls: 0,
          resetAt: this.getNextResetTime(),
        },
      });
    }

    // Check daily call limit
    const limits = PATIENT_LIMITS.AUTHENTICATED; // or determine based on user tier
    if (usageLimit.callsToday >= limits.callsPerDay) {
      const resetIn = Math.ceil((usageLimit.resetAt.getTime() - Date.now()) / 1000);
      return {
        allowed: false,
        reason: `Daily call limit reached (${limits.callsPerDay} calls). Try again tomorrow.`,
        retryAfter: resetIn,
      };
    }

    // Check consecutive calls (prevent spam)
    if (usageLimit.consecutiveCalls >= 3) {
      const timeSinceLastCall = usageLimit.lastCallAt
        ? Math.floor((Date.now() - usageLimit.lastCallAt.getTime()) / 1000)
        : Infinity;

      if (timeSinceLastCall < 3600) { // 1 hour
        return {
          allowed: false,
          reason: "Too many calls in a short time. Please wait before trying again.",
          retryAfter: 3600 - timeSinceLastCall,
        };
      }
    }

    // Check IP-based rate limiting (if provided)
    if (ipAddress && usageLimit.lastCallIp === ipAddress) {
      const timeSinceLastCall = usageLimit.lastCallAt
        ? Math.floor((Date.now() - usageLimit.lastCallAt.getTime()) / 1000)
        : Infinity;

      if (timeSinceLastCall < 120) { // 2 minutes between calls from same IP
        return {
          allowed: false,
          reason: "Please wait 2 minutes between calls.",
          retryAfter: 120 - timeSinceLastCall,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Record VAPI call start
   */
  async recordCallStart(
    doctorId: string,
    callId: string,
    userId?: string,
    ipAddress?: string
  ): Promise<void> {
    // Create usage record
    await prisma.vapiUsage.create({
      data: {
        doctorId,
        userId,
        callId,
        status: "INITIATED",
        ipAddress,
        startedAt: new Date(),
      },
    });

    // Increment doctor's call count
    await prisma.subscription.update({
      where: { doctorId },
      data: {
        vapiCallsUsed: { increment: 1 },
      },
    });

    // Update patient usage limits
    if (userId) {
      await prisma.usageLimit.upsert({
        where: { userId },
        create: {
          userId,
          callsToday: 1,
          lastCallAt: new Date(),
          lastCallIp: ipAddress,
          consecutiveCalls: 1,
          resetAt: this.getNextResetTime(),
        },
        update: {
          callsToday: { increment: 1 },
          lastCallAt: new Date(),
          lastCallIp: ipAddress,
          consecutiveCalls: { increment: 1 },
        },
      });
    }
  }

  /**
   * Record VAPI call end and duration
   */
  async recordCallEnd(callId: string, duration: number): Promise<void> {
    const usage = await prisma.vapiUsage.findUnique({
      where: { callId },
    });

    if (!usage) {
      console.error(`VAPI usage record not found for callId: ${callId}`);
      return;
    }

    const durationSeconds = Math.floor(duration);

    // Update usage record
    await prisma.vapiUsage.update({
      where: { callId },
      data: {
        status: "COMPLETED",
        duration: durationSeconds,
        endedAt: new Date(),
      },
    });

    // Update doctor's minute usage
    await prisma.subscription.update({
      where: { doctorId: usage.doctorId },
      data: {
        vapiMinutesUsed: { increment: durationSeconds },
      },
    });

    // Update patient's minute usage
    if (usage.userId) {
      await prisma.usageLimit.update({
        where: { userId: usage.userId },
        data: {
          minutesToday: { increment: durationSeconds },
        },
      });
    }
  }

  /**
   * Check free tier quota (for doctors without subscription)
   */
  private async checkFreeTierQuota(doctorId: string): Promise<{
    allowed: boolean;
    reason?: string;
    remainingCalls?: number;
  }> {
    const limits = SUBSCRIPTION_LIMITS.FREE;

    // Count calls this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const callsThisMonth = await prisma.vapiUsage.count({
      where: {
        doctorId,
        startedAt: { gte: startOfMonth },
        status: { in: ["COMPLETED", "INITIATED"] },
      },
    });

    if (callsThisMonth >= limits.calls) {
      return {
        allowed: false,
        reason: `Free tier limit reached (${limits.calls} calls/month). Please subscribe to continue.`,
        remainingCalls: 0,
      };
    }

    return {
      allowed: true,
      remainingCalls: limits.calls - callsThisMonth,
    };
  }

  /**
   * Get next reset time (midnight)
   */
  private getNextResetTime(): Date {
    const reset = new Date();
    reset.setHours(24, 0, 0, 0); // Next midnight
    return reset;
  }
}

export const vapiUsageService = new VapiUsageService();
```

## 4. API Route: Check Quota Before Call

Create `src/app/api/vapi/check-quota/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { vapiUsageService } from "@/lib/services/vapi-usage.service";
import { getAuthContext } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { doctorId } = await request.json();

    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 }
      );
    }

    // Get authenticated user (patient making the call)
    const context = await getAuthContext();
    const userId = context?.userId;

    // Get IP address for rate limiting
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Check doctor's quota
    const doctorQuota = await vapiUsageService.checkDoctorQuota(doctorId);
    if (!doctorQuota.allowed) {
      return NextResponse.json(
        {
          allowed: false,
          reason: doctorQuota.reason,
          type: "doctor_quota_exceeded",
        },
        { status: 403 }
      );
    }

    // Check patient's rate limits (if authenticated)
    if (userId) {
      const patientLimits = await vapiUsageService.checkPatientLimits(
        userId,
        ipAddress
      );
      if (!patientLimits.allowed) {
        return NextResponse.json(
          {
            allowed: false,
            reason: patientLimits.reason,
            type: "patient_rate_limit",
            retryAfter: patientLimits.retryAfter,
          },
          { status: 429 } // Too Many Requests
        );
      }
    }

    return NextResponse.json({
      allowed: true,
      doctorQuota: {
        remainingCalls: doctorQuota.remainingCalls,
        remainingMinutes: doctorQuota.remainingMinutes,
      },
    });
  } catch (error) {
    console.error("Error checking VAPI quota:", error);
    return NextResponse.json(
      { error: "Failed to check quota" },
      { status: 500 }
    );
  }
}
```

## 5. Update VapiWidget to Check Quota

Modify `src/components/patient/voice/VapiWidget.tsx`:

```typescript
// Add this before starting the call
const checkQuota = async (doctorId: string) => {
  try {
    const response = await fetch("/api/vapi/check-quota", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId }),
    });

    const data = await response.json();

    if (!data.allowed) {
      // Show error message to user
      toast.error(data.reason || "Cannot start call. Quota exceeded.");
      
      if (data.type === "doctor_quota_exceeded") {
        // Show upgrade prompt
        // You can redirect to subscription page or show modal
      }
      
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking quota:", error);
    return false;
  }
};

// In your startCall function:
const startCall = async () => {
  // ... existing code ...
  
  // Check quota before starting
  const canStart = await checkQuota(selectedDoctorId);
  if (!canStart) {
    return;
  }

  // ... rest of call start logic ...
};
```

## 6. Webhook to Track Call End

Create `src/app/api/webhooks/vapi/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { vapiUsageService } from "@/lib/services/vapi-usage.service";

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();

    // VAPI sends webhook events when calls end
    if (event.type === "call-ended" || event.type === "call-completed") {
      const { callId, duration } = event.data;

      if (callId && duration) {
        await vapiUsageService.recordCallEnd(callId, duration);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing VAPI webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
```

## 7. Usage Dashboard Component

Create `src/components/doctor/subscription/UsageDashboard.tsx`:

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function UsageDashboard() {
  const { data: usage } = useQuery({
    queryKey: ["subscription-usage"],
    queryFn: async () => {
      const res = await fetch("/api/subscriptions/usage");
      return res.json();
    },
  });

  if (!usage) return <div>Loading...</div>;

  const callsPercentage = usage.limit.calls === -1 
    ? 0 
    : (usage.used.calls / usage.limit.calls) * 100;
  
  const minutesPercentage = usage.limit.minutes === -1
    ? 0
    : (usage.used.minutes / usage.limit.minutes) * 100;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>VAPI Usage This Month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span>Voice Calls</span>
              <span>
                {usage.used.calls} / {usage.limit.calls === -1 ? "∞" : usage.limit.calls}
              </span>
            </div>
            <Progress value={callsPercentage} />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span>Minutes Used</span>
              <span>
                {Math.floor(usage.used.minutes / 60)} min /{" "}
                {usage.limit.minutes === -1 ? "∞" : Math.floor(usage.limit.minutes / 60)} min
              </span>
            </div>
            <Progress value={minutesPercentage} />
          </div>

          {callsPercentage > 80 && (
            <div className="p-3 bg-yellow-100 border border-yellow-400 rounded">
              <p className="text-sm text-yellow-800">
                ⚠️ You've used {Math.round(callsPercentage)}% of your monthly quota.
                Consider upgrading your plan.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Next Steps

1. Run Prisma migration: `npx prisma migrate dev --name add_subscriptions`
2. Implement Stripe integration for payments
3. Add subscription management UI
4. Set up VAPI webhook endpoint
5. Test quota enforcement with real calls

---

**Note**: This is a basic implementation. You'll need to:
- Add proper error handling
- Implement retry logic
- Add monitoring and alerts
- Set up Stripe webhooks for subscription changes
- Add admin dashboard for monitoring abuse

