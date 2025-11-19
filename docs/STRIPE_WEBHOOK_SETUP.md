# Stripe Webhook Setup Guide

This guide explains how to set up Stripe webhooks for the MediBook application.

## Required Webhook Events

Based on the current implementation, you need to configure the following webhook events in your Stripe Dashboard:

### Payment Events (Required)

1. **`payment_intent.succeeded`**
   - **Purpose**: Confirms successful patient payment
   - **Handler**: `handlePaymentIntentSucceeded()`
   - **Actions**:
     - Updates payment status to `COMPLETED`
     - Holds doctor payout until after appointment
     - Sends appointment confirmation email
   - **Critical**: Yes - Required for payment confirmation

2. **`payment_intent.payment_failed`**
   - **Purpose**: Handles failed payment attempts
   - **Handler**: `handlePaymentIntentFailed()`
   - **Actions**:
     - Updates payment status to `FAILED`
     - Allows patient to retry payment
   - **Critical**: Yes - Required for payment failure handling

3. **`charge.refunded`**
   - **Purpose**: Handles refunds for cancelled appointments
   - **Handler**: `handleChargeRefunded()`
   - **Actions**:
     - Updates payment record with refund information
     - Adjusts commission calculations
   - **Critical**: Yes - Required for refund processing

### Transfer Events (Required for Doctor Payouts)

4. **`transfer.created`**
   - **Purpose**: Confirms successful doctor payout via Stripe Connect
   - **Handler**: `handleTransferCreated()`
   - **Actions**:
     - Marks doctor payout as completed
     - Updates payment record with transfer confirmation
   - **Critical**: Yes - Required for payout confirmation

5. **`transfer.failed`**
   - **Purpose**: Handles failed doctor payouts via Stripe Connect
   - **Handler**: `handleTransferFailed()`
   - **Actions**:
     - Logs transfer failure with details
     - Keeps `doctorPaid` as false for admin retry
     - Records failure for manual intervention
   - **Critical**: Yes - Required for payout failure handling

6. **`transfer.paid`**
   - **Purpose**: Confirms transfer was successfully paid out (redundant with `transfer.created`)
   - **Handler**: Logged for completeness
   - **Actions**: Logs event for audit trail
   - **Critical**: No - Informational only

### Optional but Recommended Events

5. **`payment_intent.amount_capturable_updated`**
   - **Purpose**: Tracks when payment becomes capturable
   - **Use Case**: Useful for debugging payment flows
   - **Critical**: No

6. **`charge.succeeded`**
   - **Purpose**: Alternative confirmation for successful charges
   - **Use Case**: Backup confirmation if payment_intent events fail
   - **Critical**: No (already handled by `payment_intent.succeeded`)

7. **`charge.failed`**
   - **Purpose**: Alternative failure notification
   - **Use Case**: Backup failure handling
   - **Critical**: No (already handled by `payment_intent.payment_failed`)

### Stripe Connect Events (Optional - for account management)

8. **`account.updated`**
   - **Purpose**: Tracks changes to doctor's Stripe Connect account
   - **Use Case**: Sync account status changes
   - **Critical**: No

9. **`account.application.deauthorized`**
   - **Purpose**: Handles when doctor disconnects their account
   - **Use Case**: Disable doctor payments when account disconnected
   - **Critical**: No

## Setup Instructions

### Step 1: Get Your Webhook Endpoint URL

Your webhook endpoint is:
```
https://yourdomain.com/api/webhooks/stripe
```

For local development, use a tool like [ngrok](https://ngrok.com/) or [Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
# Using Stripe CLI (recommended for local dev)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Step 2: Configure Webhook in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter your webhook endpoint URL:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```
4. Select the events to listen to (see list above)
5. Click **"Add endpoint"**

### Step 3: Get Webhook Signing Secret

1. After creating the endpoint, click on it in the webhooks list
2. Click **"Reveal"** next to "Signing secret"
3. Copy the secret (starts with `whsec_...`)
4. Add it to your `.env` file:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

### Step 4: Test Your Webhook

#### Using Stripe CLI (Recommended)

```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Linux: See https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
stripe trigger transfer.created
```

#### Using Stripe Dashboard

1. Go to your webhook endpoint in Stripe Dashboard
2. Click **"Send test webhook"**
3. Select an event type (e.g., `payment_intent.succeeded`)
4. Click **"Send test webhook"**
5. Check your server logs for the webhook processing

### Step 5: Verify Webhook Signature

The webhook handler automatically verifies the Stripe signature using the `STRIPE_WEBHOOK_SECRET`. Make sure:

1. The secret is correctly set in your environment variables
2. The secret matches the one from your Stripe Dashboard
3. Your server can access the environment variable

## Webhook Event Flow

### Payment Flow

```
1. Patient creates appointment
   ↓
2. Payment Link created via Stripe
   ↓
3. Patient completes payment
   ↓
4. Stripe sends: payment_intent.succeeded
   ↓
5. Handler confirms payment → sends email → holds payout
```

### Refund Flow

```
1. Appointment cancelled
   ↓
2. Refund processed via Stripe API
   ↓
3. Stripe sends: charge.refunded
   ↓
4. Handler updates payment record with refund info
```

### Payout Flow

```
1. Appointment completed
   ↓
2. Scheduled payout time reached (2 hours after appointment)
   ↓
3. Transfer created to doctor's Connect account
   ↓
4. Stripe sends: transfer.created
   ↓
5. Handler confirms payout in database
```

## Troubleshooting

### Webhook Not Receiving Events

1. **Check endpoint URL**: Ensure it's publicly accessible (not localhost)
2. **Verify signature secret**: Must match the one in Stripe Dashboard
3. **Check server logs**: Look for webhook processing errors
4. **Test with Stripe CLI**: Use `stripe listen` to forward events locally

### Webhook Signature Verification Failed

- **Error**: `Webhook Error: No signatures found matching the expected signature`
- **Solution**: 
  - Verify `STRIPE_WEBHOOK_SECRET` is set correctly
  - Ensure you're using the correct secret for the correct endpoint
  - Check that the request body is not being modified before signature verification

### Payment Not Confirming

- **Check**: Is `payment_intent.succeeded` event being received?
- **Check**: Are payment metadata fields (`appointmentId`, `doctorId`) set correctly?
- **Check**: Server logs for errors in `handlePaymentIntentSucceeded()`

### Payout Not Confirming

- **Check**: Is `transfer.created` event being received?
- **Check**: Is `stripeTransferId` stored correctly in payment record?
- **Check**: Server logs for errors in `handleTransferCreated()`

## Security Best Practices

1. **Always verify webhook signatures** - The handler does this automatically
2. **Use HTTPS** - Required for production webhooks
3. **Keep webhook secret secure** - Never commit to version control
4. **Idempotency** - Webhook handlers should be idempotent (safe to retry)
5. **Logging** - All webhook events are logged for debugging

## Monitoring

Monitor webhook delivery in Stripe Dashboard:
- Go to **Webhooks** → Your endpoint
- View **"Recent events"** to see delivery status
- Check **"Logs"** for detailed request/response information

## Production Checklist

- [ ] Webhook endpoint is publicly accessible (HTTPS)
- [ ] `STRIPE_WEBHOOK_SECRET` is set in production environment
- [ ] All required events are subscribed in Stripe Dashboard
- [ ] Webhook endpoint is tested with test events
- [ ] Error handling and logging are working
- [ ] Webhook retry mechanism is configured (Stripe auto-retries)
- [ ] Monitoring alerts are set up for webhook failures

## Additional Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Testing Webhooks Locally](https://stripe.com/docs/webhooks/test)

