# Medibook Subscription Strategy & Implementation Guide

## Executive Summary

**Recommended Model: B2B SaaS - Charge Doctors**

Based on market analysis and your platform architecture, **charging doctors** is the most practical and market-aligned approach for the following reasons:

1. **Market Standard**: Medical appointment booking platforms (Zocdoc, Healthgrades, SimplePractice) primarily charge healthcare providers
2. **Value Proposition**: Doctors benefit directly from patient bookings and platform features
3. **Revenue Predictability**: Doctors have consistent budgets and longer retention
4. **Scalability**: Easier to manage fewer doctor accounts vs. thousands of patients
5. **VAPI Cost Control**: Doctors can be charged for voice assistant usage, preventing patient abuse

---

## 1. Pricing Model Comparison

### Model A: Per-Appointment Pricing (Transaction-Based) 💰

**How It Works:**
- Doctors pay a fee for each appointment booked through the platform
- No monthly subscription required
- Pay only when you get value (bookings)

**Pricing Options:**

**Option A1: Flat Fee Per Appointment**
- $2-5 per confirmed appointment
- No monthly minimum
- Best for: Low-volume practices, new doctors

**Option A2: Percentage Commission**
- 3-5% of appointment value
- Example: $100 appointment = $3-5 fee
- Best for: High-value appointments, specialists

**Option A3: Tiered Per-Appointment**
- First 10 appointments/month: $5 each
- Next 20 appointments: $3 each
- 31+ appointments: $2 each
- Best for: Growing practices

**Option A4: Hybrid - Base + Per-Appointment**
- Base fee: $19/month (includes profile, basic features)
- Per appointment: $2-3 per booking
- Best for: Predictable base revenue + usage scaling

**Pros of Per-Appointment Model:**
✅ **Low Barrier to Entry**: No upfront monthly cost
✅ **Pay-as-You-Go**: Doctors only pay when they get bookings
✅ **Scalable for Doctors**: Cost scales with success
✅ **Fair Value Exchange**: Direct correlation between cost and value
✅ **Easy to Understand**: Simple pricing model
✅ **Lower Churn Risk**: No monthly commitment = less cancellation pressure
✅ **Attractive to New Doctors**: Low risk to try the platform

**Cons of Per-Appointment Model:**
❌ **Revenue Volatility**: Income fluctuates with booking volume
❌ **Lower Predictability**: Harder to forecast MRR
❌ **Higher Transaction Costs**: Payment processing fees per transaction
❌ **VAPI Cost Challenge**: Need to cover VAPI costs separately
❌ **No-Show Risk**: Charge for no-shows or eat the cost?
❌ **Administrative Overhead**: Track and bill each appointment

**VAPI Cost Handling in Per-Appointment Model:**
- **Option 1**: Include VAPI in per-appointment fee (e.g., $5/appointment includes 1 VAPI call)
- **Option 2**: Separate VAPI billing ($0.10/minute, billed monthly)
- **Option 3**: Free VAPI calls up to X per month, then charge per call
- **Option 4**: VAPI calls count as "virtual appointments" and charged same rate

**Market Examples:**
- **OpenTable**: Charges restaurants per reservation ($0.25-1.00 per cover)
- **Airbnb**: Charges hosts 3% commission per booking
- **Uber Eats**: Charges restaurants 15-30% commission
- **Calendly**: Some plans charge per booking ($2-5)

**Revenue Projections (Per-Appointment Model):**

*Scenario: $3 per appointment*
- Small practice (20 appointments/month): $60/month
- Medium practice (50 appointments/month): $150/month
- Large practice (100 appointments/month): $300/month
- Average across all: ~$120/month per doctor

*Comparison to Subscription:*
- Subscription ($49-99/month) = Predictable, lower for high-volume
- Per-appointment ($3 each) = Variable, better for low-volume, worse for high-volume

---

### Model B: Tiered Subscription (Recommended) ⭐

**Free Tier (Trial)**
- 1 verified doctor profile
- Up to 10 appointments/month
- Basic appointment booking
- 5 VAPI voice calls/month (5 min max each)
- Email support

**Starter Plan - $49/month**
- 1 verified doctor profile
- Unlimited appointments
- Basic analytics dashboard
- 50 VAPI voice calls/month (10 min max each)
- Email support
- Custom appointment types

**Professional Plan - $99/month**
- 1 verified doctor profile
- Unlimited appointments
- Advanced analytics & reporting
- 200 VAPI voice calls/month (15 min max each)
- Priority email support
- Custom branding
- Appointment reminders (SMS/Email)
- Patient management tools

**Enterprise Plan - $199/month**
- Multiple doctor profiles (up to 5)
- Unlimited appointments
- Full analytics suite
- 500 VAPI voice calls/month (unlimited duration)
- Phone support
- White-label options
- API access
- Custom integrations
- Dedicated account manager

### Option B: Usage-Based Pricing

**Base Fee: $29/month per doctor**
- Includes: Profile, unlimited appointments, basic features

**Add-ons:**
- VAPI Voice Calls: $0.10/minute (billed monthly)
- SMS Reminders: $0.05 per SMS
- Advanced Analytics: $20/month

### Option C: Hybrid Model (Most Flexible)

**Subscription + Usage**
- Base subscription: $49/month (includes 50 VAPI minutes)
- Overage charges: $0.12/minute for VAPI beyond included minutes
- Allows predictable base revenue + usage-based scaling

---

### Model C: Hybrid - Subscription + Per-Appointment (Best of Both Worlds) 🎯

**Recommended Hybrid Model:**

**Base Subscription Tiers:**
- **Starter**: $29/month
  - Includes: Profile, basic features, 25 appointments/month included
  - Additional appointments: $2 each
  - VAPI: 30 calls/month included
  
- **Professional**: $79/month
  - Includes: All features, 100 appointments/month included
  - Additional appointments: $1.50 each
  - VAPI: 150 calls/month included
  
- **Enterprise**: $149/month
  - Includes: Everything, unlimited appointments
  - VAPI: 400 calls/month included

**Why Hybrid Works:**
✅ Predictable base revenue (subscription)
✅ Scales with usage (per-appointment)
✅ Fair for both low and high-volume practices
✅ Covers VAPI costs in base subscription
✅ Easy to upgrade/downgrade

---

## 1.1 Model Comparison Matrix

| Factor | Subscription | Per-Appointment | Hybrid |
|--------|-------------|-----------------|--------|
| **Revenue Predictability** | ⭐⭐⭐⭐⭐ High | ⭐⭐ Low | ⭐⭐⭐⭐ Medium-High |
| **Barrier to Entry** | ⭐⭐ Medium | ⭐⭐⭐⭐⭐ Very Low | ⭐⭐⭐ Low |
| **Scalability** | ⭐⭐⭐ Medium | ⭐⭐⭐⭐⭐ High | ⭐⭐⭐⭐ High |
| **VAPI Cost Control** | ⭐⭐⭐⭐⭐ Easy | ⭐⭐ Difficult | ⭐⭐⭐⭐ Easy |
| **Admin Complexity** | ⭐⭐⭐⭐ Low | ⭐⭐ High | ⭐⭐⭐ Medium |
| **Churn Risk** | ⭐⭐⭐ Medium | ⭐⭐⭐⭐⭐ Low | ⭐⭐⭐⭐ Low-Medium |
| **Best For** | Established practices | New/small practices | All practices |

---

## 1.2 Recommendation: Per-Appointment Pricing for Early Stage

**For Medibook (Early Stage), Consider Per-Appointment Model:**

**Why It Makes Sense:**
1. **Lower Barrier**: Easier to onboard doctors without asking for monthly commitment
2. **Prove Value First**: Doctors see value (bookings) before paying
3. **Better for Growth**: More doctors will try the platform
4. **Fair Pricing**: Doctors only pay when they get bookings
5. **Market Fit**: Test what doctors are willing to pay per booking

**Recommended Per-Appointment Pricing:**

**Option 1: Simple Flat Fee** (Easiest to Start)
- $3 per confirmed appointment
- Free tier: First 5 appointments/month free
- VAPI: $0.10/minute (billed separately monthly, or include 1 free call per appointment)

**Option 2: Tiered Per-Appointment** (Better for Scaling)
- First 10 appointments: $4 each
- Next 20 appointments: $3 each  
- 31+ appointments: $2 each
- VAPI: Included (1 call per appointment, additional calls $0.10/min)

**Option 3: Percentage-Based** (For High-Value Appointments)
- 4% of appointment value
- Minimum: $2 per appointment
- Maximum: $10 per appointment
- VAPI: Included

**Implementation for Per-Appointment Model:**

```typescript
// Track appointments and bill accordingly
interface AppointmentBilling {
  appointmentId: string;
  doctorId: string;
  fee: number; // $2-5 per appointment
  status: 'pending' | 'charged' | 'refunded';
  appointmentValue?: number; // If using percentage
  chargedAt?: Date;
}

// Monthly billing cycle
- Track all confirmed appointments
- Generate invoice at end of month
- Charge doctor's card on file
- Handle no-shows (charge or waive?)
```

**VAPI Cost Strategy for Per-Appointment:**
- **Include in Fee**: $3/appointment includes 1 VAPI call (5 min max)
- **Separate Billing**: Track VAPI separately, bill $0.10/min monthly
- **Hybrid**: First VAPI call per appointment free, additional calls charged

**Migration Path:**
1. **Start**: Per-appointment only ($3/appointment)
2. **After 6 months**: Add subscription option for high-volume doctors
3. **After 12 months**: Offer both models, let doctors choose

---

## 1.3 ⚠️ CRITICAL: Fraud Prevention for Per-Appointment Billing

### The Risk: Doctor Doesn't Mark Appointment as Completed

**Problem Scenario:**
- Patient books appointment for $100
- Patient actually attends the appointment
- Doctor doesn't mark it as "COMPLETED" to avoid paying $3 fee
- Platform loses revenue, doctor gets free booking

**Why This Happens:**
- Manual status updates give doctors control
- No verification that appointment actually occurred
- Financial incentive to avoid marking as completed
- Difficult to detect without monitoring

### ✅ Solution 1: Charge at Booking Time (Recommended) ⭐

**How It Works:**
- Charge doctor immediately when appointment is **CONFIRMED** (not completed)
- If appointment is cancelled 24h+ before: Full refund
- If appointment is cancelled <24h before: 50% refund
- If no-show: No refund (doctor keeps the slot, patient didn't show)

**Pros:**
✅ **Eliminates Fraud**: Doctor pays upfront, can't avoid fee
✅ **Predictable Revenue**: Money collected immediately
✅ **Simpler Logic**: No need to track completion status for billing
✅ **Industry Standard**: Similar to OpenTable, restaurant reservations

**Cons:**
❌ **Refund Handling**: Need to process cancellations
❌ **Cash Flow for Doctors**: Pay before service rendered
❌ **No-Show Risk**: Doctor pays even if patient doesn't show

**Implementation:**
```typescript
// Charge when appointment is CONFIRMED
async function confirmAppointment(appointmentId: string) {
  // 1. Update status to CONFIRMED
  await updateAppointmentStatus(appointmentId, 'CONFIRMED');
  
  // 2. Create billing record
  await createAppointmentBilling({
    appointmentId,
    fee: calculateFee(appointment),
    status: 'CHARGED', // Charge immediately
    chargedAt: new Date(),
  });
  
  // 3. Charge doctor's card
  await stripe.charges.create({
    amount: feeInCents,
    customer: doctor.stripeCustomerId,
    description: `Appointment booking fee - ${appointmentId}`,
  });
}

// Handle cancellations
async function cancelAppointment(appointmentId: string, hoursBefore: number) {
  const billing = await getAppointmentBilling(appointmentId);
  
  if (hoursBefore >= 24) {
    // Full refund
    await refundBilling(billing.id, 'FULL');
  } else if (hoursBefore > 0) {
    // 50% refund
    await refundBilling(billing.id, 'PARTIAL', 0.5);
  }
  // Less than 1 hour = no refund
}
```

---

### ✅ Solution 2: Auto-Complete Based on Time (Time-Based)

**How It Works:**
- Automatically mark appointment as "COMPLETED" 2 hours after scheduled time
- Charge doctor automatically when auto-completed
- Doctor can dispute within 24 hours if patient didn't show
- Patient confirmation required for dispute resolution

**Pros:**
✅ **Reduces Manual Work**: Automatic completion
✅ **Fair for Doctors**: Can dispute no-shows
✅ **Patient Verification**: Patient can confirm attendance

**Cons:**
❌ **No-Show Handling**: Need dispute resolution system
❌ **Timing Issues**: What if appointment runs late?
❌ **Dispute Overhead**: Admin time to resolve disputes

**Implementation:**
```typescript
// Cron job runs every hour
async function autoCompleteAppointments() {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  
  // Find appointments that should be auto-completed
  const appointments = await prisma.appointment.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      date: { lte: twoHoursAgo },
      // Not already billed
      billing: null,
    },
  });
  
  for (const appointment of appointments) {
    // Auto-complete
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'COMPLETED' },
    });
    
    // Create billing (can be disputed)
    await createAppointmentBilling({
      appointmentId: appointment.id,
      fee: calculateFee(appointment),
      status: 'CHARGED',
      canDispute: true, // Doctor can dispute within 24h
      disputeDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  }
}
```

---

### ✅ Solution 3: Patient Confirmation System (Two-Party Verification)

**How It Works:**
- After appointment time passes, send patient SMS/email: "Did you attend?"
- If patient confirms: Auto-complete and charge doctor
- If patient says no-show: Mark as no-show, don't charge doctor
- If no response after 48h: Auto-complete (assume attended)

**Pros:**
✅ **Accurate**: Patient confirms actual attendance
✅ **Fair**: No charge for no-shows
✅ **Trust Building**: Patients feel heard

**Cons:**
❌ **Response Rate**: Not all patients will respond
❌ **Delayed Billing**: Wait for patient response
❌ **Complexity**: More moving parts

**Implementation:**
```typescript
async function requestPatientConfirmation(appointmentId: string) {
  const appointment = await getAppointment(appointmentId);
  
  // Send confirmation request
  await sendSMS(appointment.user.phone, {
    message: `Did you attend your appointment with Dr. ${appointment.doctor.name} on ${formatDate(appointment.date)}? Reply YES or NO`,
    appointmentId,
  });
  
  // Set timeout: if no response in 48h, auto-complete
  setTimeout(async () => {
    const confirmation = await getPatientConfirmation(appointmentId);
    if (!confirmation) {
      // No response = assume attended, charge doctor
      await completeAndCharge(appointmentId);
    }
  }, 48 * 60 * 60 * 1000);
}

async function handlePatientResponse(appointmentId: string, confirmed: boolean) {
  if (confirmed) {
    await completeAndCharge(appointmentId);
  } else {
    await markAsNoShow(appointmentId);
    // Don't charge doctor
  }
}
```

---

### ✅ Solution 4: Hybrid - Charge at Confirmation + Completion Bonus

**How It Works:**
- Charge $2 when appointment is **CONFIRMED** (base fee)
- Charge additional $1 when appointment is **COMPLETED** (completion bonus)
- Total: $3 per completed appointment
- If never completed: Only $2 charged

**Pros:**
✅ **Partial Revenue**: Get $2 even if not completed
✅ **Incentive to Complete**: Doctor gets value from marking complete
✅ **Reduced Fraud Impact**: Can't avoid all fees

**Cons:**
❌ **Still Some Fraud**: Doctor can avoid $1 completion fee
❌ **Complex Pricing**: Two charges per appointment

---

### ✅ Solution 5: Subscription with Appointment Limits (Safest)

**Alternative Approach:**
- Use subscription model instead
- Include X appointments/month in subscription
- Charge per appointment only if exceeded
- Eliminates fraud risk entirely

**Example:**
- Starter: $49/month = 50 appointments included
- Additional appointments: $2 each
- Doctor can't avoid base subscription fee

---

## 1.4 Recommended Approach: Charge at Confirmation

**For Medibook, I recommend: Charge at CONFIRMED status**

**Why:**
1. **Eliminates Fraud**: Doctor pays when they confirm, can't avoid it
2. **Industry Standard**: OpenTable, restaurant booking platforms do this
3. **Simple Implementation**: No complex completion tracking needed
4. **Predictable Revenue**: Money collected upfront

**Pricing Structure:**
- **Charge**: $3 when appointment status changes to CONFIRMED
- **Cancellation Policy**:
  - 24+ hours before: Full refund ($3)
  - 1-24 hours before: 50% refund ($1.50)
  - Less than 1 hour: No refund ($0)
- **No-Show**: No refund (doctor keeps slot, patient didn't show)

**Implementation Steps:**
1. Add webhook/listener on appointment status change
2. When status → CONFIRMED: Charge immediately
3. Track billing record linked to appointment
4. Handle cancellations with refund logic
5. Monthly invoice shows all charges and refunds

**Code Example:**
```typescript
// In appointment status update API
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { status } = await request.json();
  const { id } = await params;
  
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  
  // Update status
  const updated = await prisma.appointment.update({
    where: { id },
    data: { status },
  });
  
  // If status changed to CONFIRMED, charge doctor
  if (status === 'CONFIRMED' && appointment.status !== 'CONFIRMED') {
    await chargeAppointmentFee(updated);
  }
  
  // If status changed to CANCELLED, handle refund
  if (status === 'CANCELLED' && appointment.status !== 'CANCELLED') {
    await handleCancellationRefund(updated);
  }
  
  return NextResponse.json(updated);
}

async function chargeAppointmentFee(appointment: Appointment) {
  const fee = 3.00; // $3 per appointment
  
  // Create billing record
  const billing = await prisma.appointmentBilling.create({
    data: {
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      fee,
      status: 'CHARGED',
      chargedAt: new Date(),
    },
  });
  
  // Charge Stripe
  const doctor = await prisma.doctor.findUnique({
    where: { id: appointment.doctorId },
    include: { subscription: true },
  });
  
  if (doctor?.subscription?.stripeCustomerId) {
    await stripe.charges.create({
      amount: Math.round(fee * 100), // $3.00 = 300 cents
      customer: doctor.subscription.stripeCustomerId,
      description: `Appointment booking: ${appointment.id}`,
      metadata: {
        appointmentId: appointment.id,
        billingId: billing.id,
      },
    });
  }
}
```

**Monitoring & Fraud Detection:**
- Track doctors with high cancellation rates (potential abuse)
- Monitor for patterns: Confirm → Cancel → Rebook (to avoid fees)
- Flag accounts: >30% cancellation rate = review
- Auto-suspend: >50% cancellation rate = require manual review

---

## 2. Who Should Pay: Doctor vs Patient

### ✅ **RECOMMENDED: Charge Doctors**

**Rationale:**
1. **Market Alignment**: 90% of medical booking platforms charge providers
2. **Value Flow**: Doctors receive bookings → generate revenue → pay platform fee
3. **Business Model**: Similar to Zocdoc ($299/month per provider), Healthgrades, SimplePractice
4. **Patient Experience**: Free for patients = better adoption and more bookings for doctors
5. **Cost Control**: Doctors can be held accountable for VAPI usage limits

**Alternative: Patient Payment (Not Recommended)**
- ❌ Patients already pay for appointments
- ❌ Lower willingness to pay for booking platform
- ❌ Harder to prevent VAPI abuse (many patient accounts)
- ❌ Less predictable revenue

**Hybrid Option (Advanced)**
- Doctors pay subscription
- Patients pay per-appointment booking fee ($2-5) OR
- Patients pay for premium VAPI features (unlimited calls)

---

## 3. VAPI Credit Usage Control & Abuse Prevention

### A. Rate Limiting Strategy

**Per-Doctor Limits (Based on Subscription Tier)**
```typescript
const VAPI_LIMITS = {
  FREE: { calls: 5, minutesPerCall: 5, totalMinutes: 25 },
  STARTER: { calls: 50, minutesPerCall: 10, totalMinutes: 500 },
  PROFESSIONAL: { calls: 200, minutesPerCall: 15, totalMinutes: 3000 },
  ENTERPRISE: { calls: 500, minutesPerCall: -1, totalMinutes: -1 } // unlimited
};
```

**Per-Patient Limits (Prevent Individual Abuse)**
- Free tier patients: 2 calls/day, 5 min max per call
- Authenticated patients: 10 calls/day, 15 min max per call
- Rate limit: 1 call per 2 minutes (prevents rapid-fire abuse)

### B. Abuse Prevention Mechanisms

1. **Authentication Requirements**
   - Require Clerk authentication for all VAPI calls
   - Track calls per `clerkId` to prevent duplicate accounts
   - Verify email before allowing VAPI access

2. **Call Validation**
   - Minimum call duration: 30 seconds (prevents spam calls)
   - Maximum consecutive calls: 3 per hour per user
   - IP-based rate limiting: 10 calls/hour per IP address

3. **Usage Monitoring**
   - Real-time usage tracking in database
   - Alert when 80% of monthly limit reached
   - Auto-block when limit exceeded (with upgrade prompt)

4. **Fraud Detection**
   - Flag accounts with >20 calls/day
   - Monitor for bot-like patterns (same duration, no interaction)
   - Require CAPTCHA after 5 failed booking attempts

5. **Cost Controls**
   - Hard limit: Stop VAPI calls when doctor's quota exhausted
   - Soft limit: Warn at 80%, allow with confirmation at 100%
   - Overage billing: Charge $0.12/minute beyond included minutes

### C. Implementation Architecture

```
┌─────────────────┐
│  VAPI Call Init │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Check Doctor Quota     │ ◄─── Subscription Tier
│  Check Patient Limits   │ ◄─── Per-User Limits
│  Check IP Rate Limit     │ ◄─── Abuse Prevention
└────────┬────────────────┘
         │
    ┌────┴────┐
    │  Allow? │
    └────┬────┘
         │
    ┌────┴────┐
    │  YES   │  NO
    └───┬────┘   │
        │        │
        ▼        ▼
┌─────────────┐ ┌──────────────┐
│ Start Call  │ │ Block + Show │
│ Track Usage │ │ Upgrade Msg  │
└─────────────┘ └──────────────┘
```

---

## 4. Database Schema Additions

### Per-Appointment Billing Model (Alternative to Subscription)

```prisma
model AppointmentBilling {
  id            String   @id @default(cuid())
  appointmentId String   @unique
  appointment   Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  
  doctorId      String
  doctor        Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  
  // Billing details
  fee           Decimal  // Amount charged (e.g., $3.00)
  feeType       BillingFeeType // FLAT, PERCENTAGE, TIERED
  appointmentValue Decimal? // Original appointment value (for percentage)
  percentage    Decimal? // Percentage charged (e.g., 0.04 for 4%)
  
  // Status
  status        BillingStatus @default(PENDING)
  isNoShow      Boolean  @default(false)
  noShowCharged Boolean  @default(false)
  
  // Payment tracking
  invoiceId     String?  // Link to monthly invoice
  chargedAt     DateTime?
  refundedAt    DateTime?
  refundReason  String?
  refundAmount  Decimal? // Partial refund amount
  
  // Dispute tracking (for auto-complete model)
  canDispute    Boolean  @default(false)
  disputeDeadline DateTime?
  isDisputed    Boolean  @default(false)
  disputeReason String?
  disputeResolvedAt DateTime?
  
  // Charge timing (for fraud prevention)
  chargedAtStatus String? // Status when charged (CONFIRMED, COMPLETED, etc.)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([doctorId, createdAt])
  @@index([status, createdAt])
  @@map("appointment_billing")
}

model MonthlyInvoice {
  id            String   @id @default(cuid())
  doctorId      String
  doctor        Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  
  month         Int      // 1-12
  year          Int
  periodStart   DateTime
  periodEnd     DateTime
  
  // Totals
  totalAppointments Int  @default(0)
  totalFee          Decimal @default(0)
  vapiCalls         Int  @default(0)
  vapiMinutes       Int  @default(0)
  vapiFee           Decimal @default(0)
  totalAmount       Decimal
  
  // Payment
  status        InvoiceStatus @default(PENDING)
  stripeInvoiceId String?     @unique
  paidAt         DateTime?
  dueDate        DateTime
  
  // Line items
  billingItems  AppointmentBilling[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([doctorId, year, month])
  @@index([status, dueDate])
  @@map("monthly_invoices")
}

enum BillingFeeType {
  FLAT        // Fixed $3 per appointment
  PERCENTAGE  // 4% of appointment value
  TIERED      // Different rates based on volume
}

enum BillingStatus {
  PENDING     // Appointment booked, not yet billed
  INVOICED    // Added to monthly invoice
  CHARGED     // Payment processed
  REFUNDED    // Refunded (no-show, cancellation)
  WAIVED      // Fee waived (promotional, etc.)
}

enum InvoiceStatus {
  DRAFT       // Being prepared
  PENDING     // Sent, awaiting payment
  PAID        // Payment received
  OVERDUE     // Past due date
  CANCELLED   // Cancelled invoice
}
```

### Subscription Model (Original)
```prisma
model Subscription {
  id              String            @id @default(cuid())
  doctorId        String            @unique
  doctor          Doctor            @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  
  plan            SubscriptionPlan  @default(FREE)
  status          SubscriptionStatus @default(ACTIVE)
  
  // Billing
  currentPeriodStart DateTime       @default(now())
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean        @default(false)
  
  // Payment
  stripeCustomerId   String?        @unique
  stripeSubscriptionId String?      @unique
  paymentMethodId     String?
  
  // Usage tracking
  vapiCallsUsed      Int            @default(0)
  vapiMinutesUsed    Int            @default(0)
  appointmentsCount  Int            @default(0)
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@map("subscriptions")
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

model VapiUsage {
  id            String   @id @default(cuid())
  doctorId      String
  doctor        Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  
  userId        String?  // Patient who made the call
  user          User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  callId        String   @unique // VAPI call ID
  duration      Int      // Duration in seconds
  status        VapiCallStatus
  
  startedAt     DateTime @default(now())
  endedAt       DateTime?
  
  // Abuse prevention
  ipAddress     String?
  userAgent     String?
  
  createdAt     DateTime @default(now())
  
  @@index([doctorId, startedAt])
  @@index([userId, startedAt])
  @@map("vapi_usage")
}

enum VapiCallStatus {
  INITIATED
  COMPLETED
  FAILED
  ABANDONED
}

model UsageLimit {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Daily limits
  callsToday      Int      @default(0)
  minutesToday    Int      @default(0)
  lastCallAt      DateTime?
  
  // Monthly limits (for tracking)
  callsThisMonth  Int      @default(0)
  minutesThisMonth Int     @default(0)
  
  // Rate limiting
  lastCallIp      String?
  consecutiveCalls Int     @default(0)
  
  resetAt         DateTime // Daily reset timestamp
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("usage_limits")
}
```

### Update Existing Models
```prisma
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

model Doctor {
  // ... existing fields
  subscription       Subscription?
  vapiUsage          VapiUsage[]
  appointmentBilling AppointmentBilling[]
  monthlyInvoices    MonthlyInvoice[]
}
```

### Update Appointment Model
```prisma
model Appointment {
  // ... existing fields
  billing AppointmentBilling?
}
```

---

## 5. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Add subscription models to Prisma schema
- [ ] Create migration for subscription tables
- [ ] Set up Stripe integration (or alternative payment provider)
- [ ] Create subscription service layer

### Phase 2: VAPI Controls (Week 2-3)
- [ ] Implement usage tracking middleware
- [ ] Add rate limiting logic
- [ ] Create VAPI quota checker
- [ ] Build usage dashboard for doctors

### Phase 3: Subscription Management (Week 3-4)
- [ ] Create subscription selection UI for doctors
- [ ] Implement Stripe webhook handlers
- [ ] Build subscription management page
- [ ] Add upgrade/downgrade flows

### Phase 4: Abuse Prevention (Week 4-5)
- [ ] Implement IP-based rate limiting
- [ ] Add fraud detection algorithms
- [ ] Create usage alerts system
- [ ] Build admin monitoring dashboard

### Phase 5: Testing & Launch (Week 5-6)
- [ ] Load testing for rate limits
- [ ] Security audit
- [ ] Beta testing with select doctors
- [ ] Production deployment

---

## 6. Key Implementation Files Needed

### New Files to Create:
1. `src/lib/services/subscription.service.ts` - Subscription management
2. `src/lib/services/vapi-usage.service.ts` - VAPI usage tracking
3. `src/lib/middleware/vapi-rate-limit.ts` - Rate limiting middleware
4. `src/app/api/subscriptions/route.ts` - Subscription API
5. `src/app/api/webhooks/stripe/route.ts` - Stripe webhooks
6. `src/app/api/vapi/check-quota/route.ts` - Quota validation
7. `src/components/doctor/subscription/SubscriptionPlans.tsx` - Pricing UI
8. `src/components/doctor/subscription/UsageDashboard.tsx` - Usage display

### Files to Modify:
1. `src/lib/vapi.ts` - Add quota checking before calls
2. `src/components/patient/voice/VapiWidget.tsx` - Add usage warnings
3. `src/app/api/appointments/route.ts` - Track appointment-based usage
4. `prisma/schema.prisma` - Add subscription models

---

## 7. Pricing Strategy Recommendations

### Market Comparison:
- **Zocdoc**: $299/month per provider
- **SimplePractice**: $39-159/month per provider
- **Healthgrades**: $299-499/month per provider
- **Calendly (Healthcare)**: $8-16/month per user

### Recommended Pricing for Medibook:
Given you're early-stage with VAPI integration:

**Starter: $49/month** (Competitive entry point)
**Professional: $99/month** (Sweet spot for most practices)
**Enterprise: $199/month** (For multi-doctor practices)

**Rationale:**
- Lower than established players (competitive advantage)
- High enough to cover VAPI costs ($0.05-0.10/min)
- Scalable as you add features
- Can increase prices as platform matures

---

## 8. VAPI Cost Management

### Cost Breakdown:
- VAPI typically charges: $0.05-0.15 per minute
- Average call: 5-10 minutes = $0.25-1.50 per call
- 50 calls/month = $12.50-75 in costs

### Cost Control Strategy:
1. **Tiered Limits**: Include minutes in subscription, charge overage
2. **Call Duration Caps**: Limit max call time per tier
3. **Smart Routing**: End calls after booking completion
4. **Usage Alerts**: Warn doctors at 80% usage
5. **Auto-Upgrade Prompts**: Suggest plan upgrade when limit reached

### Profitability:
- Starter Plan ($49): Includes 500 min = ~$25-50 VAPI cost → $24-49 profit
- Professional ($99): Includes 3000 min = ~$150-450 cost → May need adjustment
- **Recommendation**: Adjust Professional to 200 calls (2000 min) or increase price to $129

---

## 9. Security & Compliance

### HIPAA Considerations:
- Ensure VAPI calls are HIPAA-compliant (BAA required)
- Encrypt usage data
- Audit logs for all VAPI calls
- Patient data privacy in usage tracking

### Payment Security:
- PCI compliance for card storage (use Stripe)
- Secure webhook endpoints
- Idempotency keys for payments

---

## 10. Success Metrics

### Key Performance Indicators:
1. **Revenue**: Monthly Recurring Revenue (MRR)
2. **Churn**: Doctor subscription cancellation rate
3. **Usage**: VAPI calls per doctor per month
4. **Abuse**: Blocked calls / Total calls ratio
5. **Conversion**: Free → Paid conversion rate

### Target Metrics:
- Free → Paid conversion: 15-25%
- Monthly churn: <5%
- Average VAPI usage: 60-70% of included quota
- Abuse rate: <1% of total calls

---

## Next Steps

1. **Review & Approve**: Review this strategy with stakeholders
2. **Choose Payment Provider**: Stripe (recommended) or alternative
3. **Start Phase 1**: Begin database schema implementation
4. **Set Up Monitoring**: Implement usage tracking from day 1
5. **Beta Test**: Launch with 5-10 doctors before full rollout

---

## Questions to Consider

1. **Free Trial Duration**: 14 days? 30 days? Forever free tier?
2. **Overage Policy**: Hard stop or allow with billing?
3. **Patient Premium Features**: Should patients pay for unlimited VAPI?
4. **Multi-Location Support**: How to handle clinics with multiple locations?
5. **International Expansion**: Different pricing for different markets?
6. **No-Show Policy**: Charge for no-shows or waive fee? (Per-appointment model)
7. **Cancellation Policy**: Refund if cancelled 24h+ before? (Per-appointment model)
8. **Minimum Monthly Fee**: Require minimum $X/month even if no appointments? (Per-appointment model)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Author**: AI Assistant  
**Status**: Draft for Review

