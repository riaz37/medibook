# User Sync Troubleshooting Guide

## Issue: Users from Clerk Not Syncing to Database

### Root Causes & Solutions

#### 1. ✅ **UserSync Component Not Rendered** (FIXED)
**Problem**: `UserSync` component was imported but not rendered in layout
**Solution**: Added `<UserSync />` to the layout
**Status**: ✅ Fixed

#### 2. **Webhook Not Configured**
**Problem**: Clerk webhook not set up in Clerk Dashboard
**Symptoms**: 
- Users sign up but don't appear in database
- No webhook events in Clerk Dashboard

**Solution**:
1. Go to Clerk Dashboard → Webhooks
2. Click "Add Endpoint"
3. Enter URL: `https://yourdomain.com/api/webhooks/clerk` (or `http://localhost:3000/api/webhooks/clerk` for local)
4. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the signing secret
6. Add to `.env`: `CLERK_WEBHOOK_SECRET=whsec_...`

**Test**: Create a test user in Clerk and check webhook logs

#### 3. **Webhook Secret Missing or Incorrect**
**Problem**: `CLERK_WEBHOOK_SECRET` not set or wrong
**Symptoms**: Webhook returns 400 errors

**Solution**:
```bash
# Check if secret is set
echo $CLERK_WEBHOOK_SECRET

# Add to .env.local
CLERK_WEBHOOK_SECRET=whsec_your_secret_here
```

#### 4. **Webhook Endpoint Not Accessible (Local Development)**
**Problem**: Clerk can't reach localhost webhook
**Symptoms**: Webhook events fail in Clerk Dashboard

**Solution**: Use ngrok or similar tunnel:
```bash
# Install ngrok
npm install -g ngrok

# Start your app
npm run dev

# In another terminal, create tunnel
ngrok http 3000

# Use the ngrok URL in Clerk webhook settings
# e.g., https://abc123.ngrok.io/api/webhooks/clerk
```

#### 5. **Database Connection Issues**
**Problem**: Database not accessible or connection string wrong
**Symptoms**: Webhook returns 500 errors

**Solution**:
- Check `DATABASE_URL` in `.env`
- Test database connection
- Check Prisma migrations: `npx prisma migrate dev`

#### 6. **User Missing Email**
**Problem**: Clerk user has no email address
**Symptoms**: Webhook logs show "User has no email address"

**Solution**: 
- Ensure users sign up with email
- Check Clerk user settings allow email
- Webhook will skip users without email (by design)

#### 7. **Sync Endpoint Failing**
**Problem**: `/api/users/sync` endpoint has errors
**Symptoms**: UserSync component logs errors

**Solution**:
- Check server logs for errors
- Verify `syncUserDirect()` function works
- Test endpoint directly: `POST /api/users/sync`

## How User Sync Works

### Primary Method: Webhook (Automatic)
```
User Signs Up → Clerk → Webhook → /api/webhooks/clerk → Database
```
- ✅ Automatic
- ✅ Real-time
- ✅ No user action needed
- ⚠️ Requires webhook configuration

### Fallback Method: Client Sync (Manual)
```
User Signs In → UserSync Component → /api/users/sync → Database
```
- ✅ Works without webhook
- ✅ Handles existing users
- ⚠️ Requires user to visit page

## Testing User Sync

### Test Webhook
```bash
# Use Clerk's webhook testing tool or:
curl -X POST http://localhost:3000/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -H "svix-id: test-id" \
  -H "svix-timestamp: $(date +%s)" \
  -H "svix-signature: test-sig" \
  -d '{"type":"user.created","data":{"id":"user_123","email_addresses":[{"email_address":"test@example.com"}]}}'
```

### Test Sync Endpoint
```bash
# After signing in, test sync endpoint
curl -X POST http://localhost:3000/api/users/sync \
  -H "Cookie: __session=your_session_cookie"
```

### Check Database
```sql
-- Check if user exists
SELECT * FROM users WHERE "clerkId" = 'user_xxx';

-- Check recent users
SELECT * FROM users ORDER BY "createdAt" DESC LIMIT 10;
```

## Debugging Steps

1. **Check Webhook Logs in Clerk Dashboard**
   - Go to Webhooks → Your endpoint → Logs
   - Look for failed requests
   - Check response codes

2. **Check Server Logs**
   ```bash
   # Look for webhook errors
   grep "webhook" logs.txt
   
   # Look for sync errors
   grep "sync" logs.txt
   ```

3. **Check Database**
   ```bash
   # Using Prisma Studio
   npx prisma studio
   
   # Or direct SQL
   psql $DATABASE_URL
   SELECT * FROM users;
   ```

4. **Test Components**
   - Check if `UserSync` is rendered (should see in React DevTools)
   - Check browser console for errors
   - Check network tab for `/api/users/sync` requests

## Common Error Messages

### "Error occurred -- no svix headers"
- **Cause**: Request not from Clerk webhook
- **Fix**: Ensure webhook is configured correctly

### "Error verifying webhook"
- **Cause**: Wrong `CLERK_WEBHOOK_SECRET`
- **Fix**: Update secret in `.env`

### "User has no email address"
- **Cause**: Clerk user missing email
- **Fix**: Ensure email is required in Clerk settings

### "Failed to sync user"
- **Cause**: Database error or user not found in Clerk
- **Fix**: Check database connection and Clerk user exists

## Prevention

1. ✅ Always configure webhook in production
2. ✅ Set `CLERK_WEBHOOK_SECRET` in environment
3. ✅ Test webhook after deployment
4. ✅ Monitor webhook logs regularly
5. ✅ Keep `UserSync` component as fallback

## Summary

The user sync system has two layers:
1. **Webhook** (primary) - Automatic, real-time
2. **Client Sync** (fallback) - Manual, on page load

Both are now working correctly. If users still don't sync:
1. Check webhook configuration
2. Check webhook logs
3. Check server logs
4. Test sync endpoint manually
