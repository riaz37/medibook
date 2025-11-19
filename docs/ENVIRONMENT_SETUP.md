# Environment Variables Setup Guide

This document lists all required environment variables for the Medibook application.

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

### Clerk Authentication
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
```

### Database
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/medibook?schema=public
```

### VAPI AI Voice Assistant
```bash
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_vapi_assistant_id
NEXT_PUBLIC_VAPI_API_KEY=your_vapi_api_key
```

### Admin Configuration
```bash
ADMIN_EMAIL=admin@example.com
```

### SMTP Configuration for Email Notifications (Nodemailer)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user_email@gmail.com
SMTP_PASSWORD=your_smtp_app_password
SMTP_FROM=Medibook <your_smtp_user_email@gmail.com>
```

### Application URL
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Stripe Payment Processing
```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

### Stripe Webhook Secret (for production)
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Cloudinary (for image uploads)
```bash
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Setup Instructions

1. Copy this template to create your `.env` file
2. Replace all placeholder values with your actual credentials
3. For production, use production keys (remove `_test` suffix for Stripe, use production Clerk keys)
4. Never commit the `.env` file to version control

## Getting API Keys

### Clerk
- Sign up at https://clerk.com
- Create a new application
- Copy the publishable key and secret key from the dashboard

### Stripe
- Sign up at https://stripe.com
- Get your API keys from the Dashboard → Developers → API keys
- Set up webhooks in Dashboard → Developers → Webhooks

### VAPI
- Sign up at https://vapi.ai
- Create an assistant and get the assistant ID
- Get your API key from the dashboard

### Cloudinary
- Sign up at https://cloudinary.com
- Get your cloud name, API key, and API secret from the dashboard

### SMTP (Gmail Example)
- Enable 2-factor authentication on your Gmail account
- Generate an App Password: Google Account → Security → App passwords
- Use your Gmail address as SMTP_USER and the app password as SMTP_PASSWORD

