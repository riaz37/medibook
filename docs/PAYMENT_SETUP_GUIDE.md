# Payment System Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Migration
```bash
npx prisma migrate dev --name add_payment_system
npx prisma generate
```

### 3. Environment Variables
Add to your `.env.local`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: For cron job
CRON_SECRET=your-random-secret-key
```

### 4. Stripe Setup

#### Get API Keys:
1. Go to https://dashboard.stripe.com
2. Navigate to Developers → API keys
3. Copy your **Secret key** and **Publishable key**
4. Add to `.env.local`

#### Set Up Webhook:
1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe` (or `http://localhost:3000/api/webhooks/stripe` for local)
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `transfer.created`
   - `transfer.failed`
5. Copy the **Signing secret** and add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

#### Enable Stripe Connect:
1. Go to Settings → Connect
2. Enable Stripe Connect
3. Configure your Connect settings

### 5. Initialize Platform Settings

Run this once (via admin UI or script):

```typescript
// Via Admin UI: Go to /admin/settings/payments
// Or via API:
POST /api/admin/settings/commission
{
  "commissionPercentage": 3.0
}
```

### 6. Test the Flow

1. **Create Doctor Account**
   - Sign up as doctor
   - Complete profile

2. **Set Up Payment Account**
   - Go to `/doctor/settings/payments`
   - Click "Set Up Payment Account"
   - Complete Stripe Connect onboarding

3. **Create Appointment Type**
   - Go to doctor settings
   - Create appointment type with price (e.g., $100)
   - See commission preview showing:
     - Patient pays: $100
     - Platform fee: $3 (3%)
     - Doctor receives: $97

4. **Book Appointment as Patient**
   - Select doctor
   - Choose time and appointment type
   - Confirm details
   - **Complete payment** (use Stripe test card: `4242 4242 4242 4242`)
   - Receive confirmation email

5. **Verify Payment**
   - Check Stripe Dashboard → Payments
   - Check database `appointment_payments` table
   - Verify webhook was received

6. **Test Payout**
   - Wait for appointment time + 2 hours
   - Or manually trigger: `GET /api/cron/payouts` (admin only)
   - Check doctor's Stripe Connect account

---

## Testing Cards

Use these Stripe test cards:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires 3D Secure**: `4000 0025 0000 3155`

Use any future expiry date, any CVC, and any ZIP code.

---

## Common Issues

### Webhook Not Receiving Events
- Check webhook URL is correct
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check webhook logs in Stripe dashboard
- Ensure endpoint is publicly accessible

### Payment Intent Creation Fails
- Verify Stripe keys are correct
- Check appointment has valid price
- Ensure appointment type exists

### Doctor Payout Not Processing
- Verify doctor completed Stripe Connect onboarding
- Check `doctor_payment_accounts` table for `accountStatus = 'ACTIVE'`
- Ensure appointment time has passed + 2 hours
- Check payout cron job is running

### Commission Not Calculating
- Verify `platform_settings` table has a record
- Check commission percentage is set (default: 3%)
- Ensure appointment type has a price

---

## API Endpoints

### Public
- `GET /api/settings/commission` - Get commission percentage

### Patient
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/appointments/[id]/cancel` - Cancel with refund

### Doctor
- `GET /api/doctors/[id]/payment-setup` - Get payment account status
- `POST /api/doctors/[id]/payment-setup` - Set up payment account
- `GET /api/doctors/[id]/payments` - Get payment history

### Admin
- `GET /api/admin/settings/commission` - Get commission settings
- `PUT /api/admin/settings/commission` - Update commission
- `GET /api/admin/revenue` - Get platform revenue stats
- `GET /api/cron/payouts` - View pending payouts
- `POST /api/cron/payouts` - Process payouts (with auth)

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler

---

## Database Models

### AppointmentPayment
- Tracks patient payment, commission, doctor payout
- Status: PENDING → PROCESSING → COMPLETED

### DoctorPaymentAccount
- Stripe Connect account info
- Status: PENDING → ACTIVE

### PlatformSettings
- Commission percentage (default: 3%)
- Admin configurable

### PaymentRefund
- Refund tracking
- Time-based refund policy

---

## Next Steps

1. ✅ Set up Stripe account
2. ✅ Configure webhook
3. ✅ Run database migration
4. ✅ Test payment flow
5. ✅ Set up cron job for payouts
6. ✅ Monitor production payments

---

## Support

For issues:
1. Check Stripe Dashboard logs
2. Check application logs
3. Verify database records
4. Test with Stripe test cards

