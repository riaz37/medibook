# 💳 Patient Payment Model: Taking Payment at Booking

## Overview

**Model**: Patient pays for appointment + platform fee when booking. Platform takes commission immediately, doctor receives payment after appointment.

This is a **marketplace model** (similar to Airbnb, Uber Eats, OpenTable).

---

## 🎯 How It Works

### Payment Flow

```
1. Patient Books Appointment
   └─> Patient pays: $100 (appointment) + $3 (platform fee) = $103 total
   
2. Platform Takes Fee Immediately
   └─> Platform keeps: $3 (platform fee)
   └─> Hold in escrow: $100 (doctor's payment)
   
3. Appointment Happens
   └─> Status: CONFIRMED → COMPLETED
   
4. Platform Pays Doctor
   └─> Doctor receives: $100 (minus any fees)
   └─> Platform keeps: $3 commission
```

### Alternative: Hold & Release Model

```
1. Patient Books → Pays $103
2. Platform holds $100 in escrow
3. After appointment (or 24h after scheduled time):
   └─> Auto-release $100 to doctor
   └─> Platform keeps $3
```

---

## ✅ Advantages of Patient Payment Model

### 1. **Zero Fraud Risk** ⭐⭐⭐⭐⭐
- ✅ Platform fee collected immediately (can't be avoided)
- ✅ Patient already paid, so no risk of doctor avoiding fee
- ✅ No need to track completion status for billing
- ✅ Money in your account before service rendered

### 2. **Better Cash Flow** ⭐⭐⭐⭐⭐
- ✅ Platform gets paid upfront
- ✅ No waiting for monthly invoices
- ✅ Immediate revenue recognition
- ✅ Can hold doctor payments (escrow) until appointment

### 3. **Reduced No-Shows** ⭐⭐⭐⭐
- ✅ Patient pays upfront = more commitment
- ✅ Can implement no-show penalties
- ✅ Better appointment reliability
- ✅ Industry standard (restaurants, services)

### 4. **Simpler for Doctors** ⭐⭐⭐⭐
- ✅ No payment method needed from doctors
- ✅ No monthly billing to manage
- ✅ Automatic payment after appointment
- ✅ Less administrative overhead

### 5. **Marketplace Model** ⭐⭐⭐⭐⭐
- ✅ Similar to Airbnb, Uber, OpenTable
- ✅ Patients understand paying upfront
- ✅ Standard in service industries
- ✅ Proven business model

---

## ⚠️ Challenges & Solutions

### Challenge 1: Refund Handling

**Problem**: What if patient cancels? Who pays for refund?

**Solutions:**

**Option A: Platform Absorbs Refund Cost**
- Patient gets full refund ($103)
- Platform keeps $3 fee (already earned)
- Doctor never received payment, so no refund needed
- **Pros**: Simple, patient-friendly
- **Cons**: Platform loses $3 on every cancellation

**Option B: Platform Fee Non-Refundable**
- Patient gets $100 refund (appointment cost)
- Platform keeps $3 (service fee)
- Doctor never received payment
- **Pros**: Platform always earns on bookings
- **Cons**: Patients may complain about non-refundable fee

**Option C: Time-Based Refund Policy** (Recommended)
- 24+ hours before: Full refund ($103) - Platform absorbs $3
- 1-24 hours before: 50% refund ($51.50) - Platform keeps $3
- <1 hour: No refund - Platform keeps $3, doctor gets $100
- **Pros**: Fair for all parties, reduces last-minute cancellations
- **Cons**: More complex logic

**Recommended**: **Option C** - Time-based with platform fee always kept

### Challenge 2: Doctor Payment Timing

**Problem**: When do you pay the doctor?

**Solutions:**

**Option A: Pay Immediately After Appointment**
- Doctor marks as COMPLETED → Auto-pay $100
- **Pros**: Fast payment, doctor happy
- **Cons**: Risk if patient disputes

**Option B: Hold for 24-48 Hours** (Recommended)
- After appointment time + 2 hours → Auto-pay $100
- Hold period allows for disputes
- **Pros**: Protection against disputes, still fast
- **Cons**: Slight delay

**Option C: Weekly/Monthly Payout**
- Batch payments weekly or monthly
- **Pros**: Lower transaction fees
- **Cons**: Slower for doctors

**Recommended**: **Option B** - Auto-pay 2 hours after appointment time

### Challenge 3: No-Show Handling

**Problem**: Patient paid but didn't show up. Who gets the money?

**Solutions:**

**Option A: Doctor Gets Paid, Patient Loses Money** (Recommended)
- Patient: No refund (they didn't show)
- Doctor: Gets $100 (kept the time slot)
- Platform: Keeps $3
- **Pros**: Fair - doctor reserved time, patient didn't show
- **Cons**: Patients may be unhappy

**Option B: Partial Refund**
- Patient: Gets 50% refund ($51.50)
- Doctor: Gets $50 (partial payment)
- Platform: Keeps $3
- **Pros**: More patient-friendly
- **Cons**: Doctor loses money for no-show

**Recommended**: **Option A** - Doctor gets paid, patient loses money (standard practice)

### Challenge 4: Dispute Resolution

**Problem**: Patient says appointment didn't happen, doctor says it did.

**Solutions:**
- Hold payment for 24-48 hours after appointment
- Allow patient to dispute within 48 hours
- Admin reviews disputes
- If valid dispute: Refund patient, don't pay doctor
- If invalid: Pay doctor, keep platform fee

---

## 💰 Pricing Structure

### Recommended Commission Model

**Platform Fee: $3-5 per appointment** (or 3-5% of appointment value)

**Examples:**

**Low-Value Appointments ($50-100)**
- Appointment: $75
- Platform fee: $3 (4%)
- Patient pays: $78
- Doctor receives: $75

**Medium-Value Appointments ($100-200)**
- Appointment: $150
- Platform fee: $5 (3.3%)
- Patient pays: $155
- Doctor receives: $150

**High-Value Appointments ($200+)**
- Appointment: $250
- Platform fee: $8 (3.2%)
- Patient pays: $258
- Doctor receives: $250

**Alternative: Percentage-Based**
- 3-5% of appointment value
- Minimum: $2
- Maximum: $10

---

## 🏗️ Implementation Architecture

### Database Schema

```prisma
model AppointmentPayment {
  id            String   @id @default(cuid())
  appointmentId String   @unique
  appointment   Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  
  // Payment amounts
  appointmentAmount Decimal // $100 (what doctor charges)
  platformFee      Decimal  // $3 (your commission)
  totalAmount       Decimal  // $103 (what patient pays)
  
  // Payment status
  patientPaid       Boolean  @default(false)
  patientPaidAt     DateTime?
  stripePaymentId   String?  @unique
  
  // Doctor payout
  doctorPaid        Boolean  @default(false)
  doctorPaidAt     DateTime?
  stripePayoutId    String?
  payoutAmount      Decimal  // Usually = appointmentAmount
  
  // Refund tracking
  refunded          Boolean  @default(false)
  refundAmount      Decimal?
  refundReason      String?
  refundedAt        DateTime?
  stripeRefundId    String?
  
  // Dispute tracking
  isDisputed        Boolean  @default(false)
  disputeReason     String?
  disputeResolvedAt DateTime?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([appointmentId])
  @@map("appointment_payments")
}

model DoctorPayout {
  id            String   @id @default(cuid())
  doctorId      String
  doctor        Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  
  // Payout details
  totalAmount    Decimal
  appointmentCount Int
  periodStart   DateTime
  periodEnd     DateTime
  
  // Payment
  status        PayoutStatus @default(PENDING)
  stripePayoutId String?     @unique
  paidAt        DateTime?
  
  // Line items
  payments      AppointmentPayment[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("doctor_payouts")
}

enum PayoutStatus {
  PENDING
  PROCESSING
  PAID
  FAILED
}
```

### Payment Flow Code

```typescript
// 1. When patient books appointment
async function bookAppointment(data: BookAppointmentInput) {
  const appointment = await createAppointment(data);
  
  // Calculate fees
  const appointmentAmount = appointment.appointmentType.price; // $100
  const platformFee = 3.00; // $3
  const totalAmount = appointmentAmount + platformFee; // $103
  
  // Create payment record
  const payment = await prisma.appointmentPayment.create({
    data: {
      appointmentId: appointment.id,
      appointmentAmount,
      platformFee,
      totalAmount,
      patientPaid: false, // Will be true after Stripe payment
    },
  });
  
  // Charge patient via Stripe
  const charge = await stripe.charges.create({
    amount: Math.round(totalAmount * 100), // $103 = 10300 cents
    currency: 'usd',
    source: patientPaymentMethodId,
    description: `Appointment with Dr. ${appointment.doctor.name}`,
    metadata: {
      appointmentId: appointment.id,
      paymentId: payment.id,
    },
  });
  
  // Update payment record
  await prisma.appointmentPayment.update({
    where: { id: payment.id },
    data: {
      patientPaid: true,
      patientPaidAt: new Date(),
      stripePaymentId: charge.id,
    },
  });
  
  return { appointment, payment };
}

// 2. When appointment is completed (auto-pay doctor)
async function completeAppointment(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { payment: true, doctor: true },
  });
  
  if (!appointment.payment || appointment.payment.doctorPaid) {
    return; // Already paid or no payment record
  }
  
  // Wait 2 hours after appointment time (dispute window)
  const appointmentTime = new Date(appointment.date);
  const twoHoursAfter = new Date(appointmentTime.getTime() + 2 * 60 * 60 * 1000);
  
  if (new Date() < twoHoursAfter) {
    // Schedule payout for later
    await schedulePayout(appointmentId, twoHoursAfter);
    return;
  }
  
  // Pay doctor
  const payout = await stripe.transfers.create({
    amount: Math.round(appointment.payment.appointmentAmount * 100),
    currency: 'usd',
    destination: appointment.doctor.stripeAccountId, // Doctor's Stripe Connect account
    metadata: {
      appointmentId: appointment.id,
      paymentId: appointment.payment.id,
    },
  });
  
  await prisma.appointmentPayment.update({
    where: { id: appointment.payment.id },
    data: {
      doctorPaid: true,
      doctorPaidAt: new Date(),
      stripePayoutId: payout.id,
      payoutAmount: appointment.payment.appointmentAmount,
    },
  });
}

// 3. Handle cancellations
async function cancelAppointment(appointmentId: string, hoursBefore: number) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { payment: true },
  });
  
  if (!appointment.payment || !appointment.payment.patientPaid) {
    return; // No payment to refund
  }
  
  let refundAmount = 0;
  
  if (hoursBefore >= 24) {
    // Full refund (platform absorbs $3 fee)
    refundAmount = appointment.payment.totalAmount; // $103
  } else if (hoursBefore >= 1) {
    // 50% refund
    refundAmount = appointment.payment.appointmentAmount * 0.5; // $50
    // Platform keeps $3 fee
  } else {
    // No refund
    // Platform keeps $3, doctor gets $100 (no-show scenario)
    await completeAppointment(appointmentId);
    return;
  }
  
  // Process refund
  const refund = await stripe.refunds.create({
    charge: appointment.payment.stripePaymentId!,
    amount: Math.round(refundAmount * 100),
    reason: 'requested_by_customer',
    metadata: {
      appointmentId: appointment.id,
      hoursBefore: hoursBefore.toString(),
    },
  });
  
  await prisma.appointmentPayment.update({
    where: { id: appointment.payment.id },
    data: {
      refunded: true,
      refundAmount,
      refundReason: `Cancelled ${hoursBefore}h before appointment`,
      refundedAt: new Date(),
      stripeRefundId: refund.id,
    },
  });
}
```

---

## 📊 Comparison: Patient Payment vs Doctor Payment

| Factor | Patient Pays | Doctor Pays |
|--------|-------------|-------------|
| **Fraud Risk** | ⭐⭐⭐⭐⭐ None | ⭐⭐⭐⭐⭐ None (if charge at CONFIRMED) |
| **Cash Flow** | ⭐⭐⭐⭐⭐ Excellent (upfront) | ⭐⭐⭐ Good (monthly) |
| **No-Show Impact** | ⭐⭐⭐⭐ Low (patient paid) | ⭐⭐⭐ Medium |
| **Complexity** | ⭐⭐⭐ Medium (refunds, payouts) | ⭐⭐⭐⭐ Low (simple billing) |
| **Doctor Onboarding** | ⭐⭐⭐⭐⭐ Easy (no payment method) | ⭐⭐⭐ Medium (need card) |
| **Patient Experience** | ⭐⭐⭐ Good (standard) | ⭐⭐⭐⭐⭐ Excellent (free) |
| **Revenue Predictability** | ⭐⭐⭐⭐⭐ High (immediate) | ⭐⭐⭐ Medium (monthly) |

---

## 🎯 Recommended Approach

### **Patient Payment Model** (Recommended for Marketplace)

**Why:**
1. ✅ **Zero fraud risk** - Money collected upfront
2. ✅ **Better cash flow** - Immediate revenue
3. ✅ **Reduced no-shows** - Patient commitment
4. ✅ **Simpler for doctors** - No payment method needed
5. ✅ **Marketplace standard** - Airbnb, Uber model

**Implementation:**
- Patient pays: Appointment price + $3 platform fee
- Platform keeps: $3 immediately
- Doctor receives: Appointment price (2 hours after appointment)
- Cancellation: Time-based refund policy

**Pricing:**
- Platform fee: $3 per appointment (or 3-5% of value)
- Minimum: $2
- Maximum: $10

---

## 🚀 Implementation Roadmap

### Phase 1: Payment Infrastructure (Week 1-2)
- [ ] Set up Stripe Connect (for doctor payouts)
- [ ] Add payment models to database
- [ ] Create payment service layer
- [ ] Integrate Stripe payment in booking flow

### Phase 2: Booking Flow (Week 2-3)
- [ ] Add payment step to booking process
- [ ] Calculate platform fee dynamically
- [ ] Charge patient at booking
- [ ] Handle payment failures gracefully

### Phase 3: Payout System (Week 3-4)
- [ ] Auto-pay doctors after appointment
- [ ] Implement dispute window (2 hours)
- [ ] Create payout dashboard for doctors
- [ ] Handle payout failures

### Phase 4: Refund System (Week 4-5)
- [ ] Implement cancellation refund logic
- [ ] Time-based refund policy
- [ ] Handle partial refunds
- [ ] Create refund dashboard

### Phase 5: Testing & Launch (Week 5-6)
- [ ] Test payment flows
- [ ] Test refund scenarios
- [ ] Test payout system
- [ ] Beta test with select doctors

---

## 💡 Key Considerations

### Stripe Connect Setup
- Doctors need Stripe Connect accounts
- Platform can hold funds in escrow
- Automatic payouts after appointment
- Lower fees for transfers vs charges

### Legal & Compliance
- Money transmitter licenses (if holding funds)
- Tax reporting (1099 for doctors)
- Refund policy clearly stated
- Terms of service for payments

### User Experience
- Clear pricing display (appointment + fee)
- Transparent refund policy
- Easy cancellation process
- Payment confirmation emails

---

## 📈 Revenue Projections

**Per Appointment:**
- Platform fee: $3
- Stripe fees: ~$0.30 (2.9% + $0.30)
- Net revenue: ~$2.70 per appointment

**Monthly Projections:**
- 1,000 appointments: $2,700 net revenue
- 5,000 appointments: $13,500 net revenue
- 10,000 appointments: $27,000 net revenue

**Comparison to Doctor Payment Model:**
- Same $3 per appointment
- But collected immediately (better cash flow)
- No risk of non-payment

---

## 🏁 Final Recommendation

**Use Patient Payment Model** - This is actually BETTER than charging doctors because:

1. ✅ **Zero fraud risk** - Money in your account immediately
2. ✅ **Better cash flow** - No waiting for monthly invoices
3. ✅ **Reduced no-shows** - Patients more committed
4. ✅ **Simpler for doctors** - No payment setup needed
5. ✅ **Marketplace standard** - Proven model

**Implementation Priority:**
1. Set up Stripe Connect
2. Add payment to booking flow
3. Implement auto-payout system
4. Add refund handling
5. Create dashboards

---

**Document Version**: 1.0  
**Status**: Recommended Implementation  
**Next Step**: Set up Stripe Connect and payment flow

