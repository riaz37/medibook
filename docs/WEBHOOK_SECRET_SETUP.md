# Clerk Webhook Secret Setup

## Error: Base64Coder: incorrect characters for decoding

This error occurs when `CLERK_WEBHOOK_SECRET` is not in the correct format.

## Correct Format

Clerk webhook secrets should:
- Start with `whsec_`
- Be a valid base64 string
- Example: `whsec_abc123xyz...` (long string)

## How to Get the Secret

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks** section
3. Click on your webhook endpoint (or create one)
4. Copy the **Signing Secret** (it should start with `whsec_`)

## Setting the Environment Variable

### Local Development (.env.local)

```bash
CLERK_WEBHOOK_SECRET=whsec_your_actual_secret_here
```

### Production

Set in your hosting platform's environment variables:
- Vercel: Settings → Environment Variables
- Railway: Variables tab
- Other platforms: Check their documentation

## Common Issues

### 1. Secret doesn't start with `whsec_`
**Error**: "Invalid webhook secret format - must start with 'whsec_'"

**Solution**: Make sure you copied the entire secret from Clerk Dashboard, including the `whsec_` prefix.

### 2. Secret has extra whitespace
**Error**: "Base64Coder: incorrect characters for decoding"

**Solution**: The code automatically trims whitespace, but double-check your `.env` file:
```bash
# ❌ Wrong (has quotes)
CLERK_WEBHOOK_SECRET="whsec_..."

# ✅ Correct (no quotes needed)
CLERK_WEBHOOK_SECRET=whsec_...
```

### 3. Secret is from wrong webhook
**Error**: Signature verification fails

**Solution**: Make sure you're using the secret from the correct webhook endpoint in Clerk Dashboard.

### 4. Secret is outdated
**Error**: Signature verification fails

**Solution**: If you regenerated the webhook secret in Clerk, update your environment variable.

## Verification

After setting the secret, test the webhook:

```bash
# The webhook should now accept valid Clerk webhook requests
# Test by creating a user in Clerk or using Clerk's webhook test feature
```

## Debugging

If you're still having issues, check:

1. **Secret format**:
   ```bash
   # Check if secret starts with whsec_
   echo $CLERK_WEBHOOK_SECRET | head -c 6
   # Should output: whsec_
   ```

2. **Secret length**: Clerk secrets are typically 50+ characters long

3. **Environment variable loading**: Make sure your app is reading from the correct `.env` file

4. **Server restart**: After changing environment variables, restart your development server

## Example Valid Secret

```
whsec_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

Note: This is just an example format. Your actual secret will be different.
