# Vapi Voice Assistant Setup Guide

This guide explains how to set up and configure the Vapi voice assistant for appointment booking in Medibook.

## Overview

The Vapi integration allows patients to book appointments via voice calls. The assistant collects appointment details, creates the appointment, and sends a payment link via email if payment is required.

## Prerequisites

1. Vapi account (sign up at https://vapi.ai)
2. Phone number configured in Vapi
3. Environment variables configured (see below)

## Environment Variables

Add these to your `.env` file:

```env
# Vapi Configuration
VAPI_WEBHOOK_SECRET=your_webhook_secret_here  # Optional, for webhook verification

# Required existing variables
NEXT_PUBLIC_APP_URL=https://your-domain.com
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## Vapi Assistant Configuration

### 1. Create a New Assistant

1. Log in to your Vapi dashboard
2. Navigate to "Assistants" and click "Create Assistant"
3. Name it "Medibook Appointment Assistant"

### 2. Configure System Prompt

Set the system prompt to:

```
You are a friendly AI receptionist for Medibook, a medical appointment booking platform. Your role is to help patients book appointments with doctors.

When a patient calls:
1. Greet them warmly and ask how you can help
2. If they want to book an appointment, collect the following information:
   - Which doctor they'd like to see (use get_doctors to show options)
   - What date they prefer (use get_available_slots to check availability)
   - What time they prefer (from available slots)
   - What type of appointment (use get_appointment_types to show options)
   - Their email address (for payment link)
   - Their phone number (if not already known from caller ID)

3. Once you have all the information, use book_appointment to create the booking
4. Confirm the appointment details with the patient
5. Let them know they'll receive an email with payment instructions if payment is required

Be conversational, friendly, and helpful. Confirm all details clearly before booking.
```

### 3. Configure Voice Settings

- **Voice Provider**: Choose your preferred provider (ElevenLabs, OpenAI, etc.)
- **Voice**: Select a professional, friendly voice
- **Language**: English (or your preferred language)

### 4. Add Server URL

Set the Server URL to:
```
https://your-domain.com/api/vapi/webhook
```

If you've set up `VAPI_WEBHOOK_SECRET`, you can add it in the webhook settings for additional security.

### 5. Configure Tools/Functions

Add the following functions to your assistant:

#### Function 1: `get_doctors`
- **Description**: Get a list of available doctors
- **Parameters**: None
- **Returns**: List of doctors with names, specialties, and IDs

#### Function 2: `get_available_slots`
- **Description**: Get available time slots for a doctor on a specific date
- **Parameters**:
  - `doctorId` (string, required): The ID of the doctor
  - `date` (string, required): Date in YYYY-MM-DD format
- **Returns**: Array of available time slots

#### Function 3: `get_appointment_types`
- **Description**: Get appointment types and prices for a doctor
- **Parameters**:
  - `doctorId` (string, required): The ID of the doctor
- **Returns**: List of appointment types with names, durations, and prices

#### Function 4: `book_appointment`
- **Description**: Book an appointment with a doctor
- **Parameters**:
  - `doctorId` (string, required): The ID of the doctor
  - `date` (string, required): Appointment date in YYYY-MM-DD format
  - `time` (string, required): Appointment time in HH:MM format (24-hour)
  - `appointmentTypeId` (string, required): The ID of the appointment type
  - `email` (string, required): Patient's email address
  - `phoneNumber` (string, optional): Patient's phone number
  - `reason` (string, optional): Reason for appointment
- **Returns**: Confirmation message with booking details

### 6. Function Call Configuration

In Vapi, configure the function calls to:
- **Auto-call functions**: Enable this so the assistant automatically calls functions when needed
- **Function call format**: JSON

## API Endpoints

The following endpoints are available for Vapi:

### POST `/api/vapi/webhook`
Main webhook handler that processes function calls from Vapi.

**Request Format:**
```json
{
  "type": "function-call",
  "functionCall": {
    "name": "book_appointment",
    "parameters": {
      "doctorId": "...",
      "date": "2024-01-15",
      "time": "14:30",
      "appointmentTypeId": "...",
      "email": "patient@example.com"
    }
  },
  "call": {
    "from": "+1234567890",
    "to": "+0987654321"
  }
}
```

**Response Format:**
```json
{
  "result": "Appointment booked! Payment link sent to your email."
}
```

### POST `/api/vapi/appointments/book`
Internal endpoint used by the webhook to create appointments.

## User Identification

The system identifies users in the following order:
1. By email address (if provided)
2. By phone number (from caller ID or provided)
3. Creates a new user account if neither is found

New users created via Vapi will have a temporary Clerk ID and can complete full registration later.

## Payment Flow

1. **Appointment Created**: Appointment is created with `PENDING` status
2. **Payment Intent Created**: If payment is required, a Stripe Payment Intent is created
3. **Payment Link Generated**: A Stripe Payment Link is generated with 30-minute expiration
4. **Email Sent**: Payment link is sent to the patient's email
5. **Payment Completed**: Patient completes payment on Stripe's hosted page
6. **Webhook Confirms**: Stripe webhook confirms payment and updates appointment status
7. **Confirmation Email**: Final confirmation email is sent to the patient

## Testing

### Test the Webhook Locally

1. Use a tool like ngrok to expose your local server:
   ```bash
   ngrok http 3000
   ```

2. Update the Vapi Server URL to your ngrok URL:
   ```
   https://your-ngrok-url.ngrok.io/api/vapi/webhook
   ```

3. Make a test call from Vapi dashboard

### Test Function Calls

You can test individual functions using curl:

```bash
# Test get_doctors
curl -X POST https://your-domain.com/api/vapi/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "function-call",
    "functionCall": {
      "name": "get_doctors",
      "parameters": {}
    }
  }'
```

## Troubleshooting

### Common Issues

1. **Webhook not receiving calls**
   - Verify the Server URL is correct in Vapi dashboard
   - Check that your server is accessible from the internet
   - Verify webhook secret if configured

2. **User not found errors**
   - Ensure email or phone number is provided
   - Check that users exist in the database
   - Verify user creation logic is working

3. **Payment link not sent**
   - Check email service configuration
   - Verify SMTP settings
   - Check appointment has a price set

4. **Appointment booking fails**
   - Verify doctor exists and is verified
   - Check appointment type belongs to the doctor
   - Ensure date/time is in correct format
   - Verify slot is available

## Security Considerations

1. **Webhook Verification**: Use `VAPI_WEBHOOK_SECRET` to verify webhook requests
2. **Rate Limiting**: Consider adding rate limiting to prevent abuse
3. **Input Validation**: All inputs are validated before processing
4. **Payment Links**: Payment links expire after 30 minutes
5. **User Privacy**: Phone numbers and emails are handled securely

## Next Steps

1. Configure your Vapi assistant using the settings above
2. Test with a few calls to ensure everything works
3. Monitor logs for any errors
4. Adjust the system prompt based on your needs
5. Consider adding more functions for rescheduling/canceling appointments

## Support

For issues or questions:
- Check Vapi documentation: https://docs.vapi.ai
- Review application logs
- Contact support@medibook.com


