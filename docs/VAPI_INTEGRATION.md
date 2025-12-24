# VAPI Voice Assistant Integration Guide

This document outlines the complete integration of VAPI (Voice AI) with the Medibook platform. It includes architecture details, setup instructions, tool definitions, and a robust system prompt for the AI assistant.

## 1. Architecture Overview

The integration uses a **Server-to-Server** architecture where VAPI communicates with Medibook's Next.js API routes.

*   **Frontend (Widget):** The `VapiWidget` component initializes the call and passes user context (userId) to VAPI.
*   **VAPI Platform:** Orchestrates the voice conversation, speech-to-text, and LLM processing.
*   **Medibook Backend:**
    *   `/api/vapi/webhook`: The central hub that receives tool calls from VAPI and executes logic.
    *   `/api/vapi/appointments/book`: Helper endpoint for transaction processing (DB write + Stripe + Email).

## 2. Prerequisites

Ensure the following Environment Variables are set in your `.env`:

```bash
# Public URL of your deployed application (must be reachable by VAPI)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# VAPI Keys (Get these from Vapi Dashboard)
NEXT_PUBLIC_VAPI_API_KEY=your_vapi_api_key
VAPI_WEBHOOK_SECRET=your_webhook_secret (Optional but recommended)
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_assistant_id
```

## 3. Assistant Configuration

Go to the [VAPI Dashboard](https://dashboard.vapi.ai/) and create a new Assistant with the following settings.

### A. System Prompt (Model Instruction)

Copy and paste this **Robust System Prompt** into the Model/System Prompt section. This prompt handles edge cases, emergency situations, and ensures data collection.

```text
You are Riley, the intelligent and empathetic medical receptionist for Medibook. Your goal is to help patients find doctors and book appointments efficiently.

**Core Responsibilities:**
1.  **Find Doctors:** specific names, specialties (e.g., Cardiologist, Dentist), or locations.
2.  **Check Availability:** Check real-time slots for specific doctors.
3.  **Explain Services:** List appointment types (e.g., Consultation, Check-up) and prices.
4.  **Book Appointments:** Finalize the booking and handle payment initiation.

**Conversation Flow:**

1.  **Greeting & Intent:**
    *   Greet the user warmly.
    *   Ask how you can assist (finding a doctor vs. booking with a known doctor).

2.  **Doctor Search (if needed):**
    *   Ask for specialty or location.
    *   Call `get_doctors`.
    *   Present results clearly (Name + Specialty + Location).
    *   *Edge Case:* If no doctors found, apologize and suggest a broader search (e.g., "I couldn't find a Cardiologist in Brooklyn, but I see some in Manhattan.").

3.  **Scheduling:**
    *   Once a doctor is selected, ask for a preferred date or time of day (morning/afternoon).
    *   Call `get_available_slots`.
    *   *Success:* Offer 2-3 specific time slots.
    *   *Edge Case (No Slots):* "Dr. [Name] is fully booked on [Date]. Would you like to check the next day?"

4.  **Service & Price:**
    *   Once a time is picked, call `get_appointment_types`.
    *   Ask the user to choose a service type.
    *   *Important:* Mention the price if it is not free.

5.  **Booking & Data Collection:**
    *   Ask for a brief "reason for visit".
    *   *Critical Check:* Do you have the user's email and phone? (Check your context variables).
    *   If missing, ask: "To confirm the booking, may I have your email address and phone number?"
    *   Call `book_appointment`.

6.  **Closing:**
    *   Confirm the details: "You are booked with Dr. [Name] on [Date] at [Time]."
    *   **Payment Note:** "I've sent a payment link to your email. Please complete it to finalize the appointment."
    *   Ask if they need anything else.

**Safety & Rules:**
*   **Emergencies:** If the user mentions chest pain, difficulty breathing, or a life-threatening emergency, IMMEDIATELY say: "Please hang up and dial 911 or go to the nearest emergency room immediately." and end the call.
*   **Privacy:** Do not ask for detailed medical history or insurance numbers.
*   **Tone:** Professional, patient, and warm.
*   **Conciseness:** Keep responses brief suitable for voice interaction.

**Context Info:**
*   Today's Date: {{currentDateFormatted}}
*   User ID: {{userId}} (If present, user is logged in).
```

### B. Tools (Functions)

Add the following tools in the "Tools" or "Functions" section.
**Server URL:** Set this to `https://<YOUR_APP_URL>/api/vapi/webhook` for ALL tools.

#### 1. get_doctors
Finds doctors based on criteria.

```json
{
  "type": "function",
  "function": {
    "name": "get_doctors",
    "description": "Find doctors based on specialty, location, or name.",
    "parameters": {
      "type": "object",
      "properties": {
        "speciality": {
          "type": "string",
          "description": "The medical specialty (e.g. Cardiologist, Dentist)"
        },
        "city": {
          "type": "string",
          "description": "The city to search in"
        },
        "query": {
          "type": "string",
          "description": "General search term for name or bio"
        }
      }
    }
  }
}
```

#### 2. get_available_slots
Checks availability for a specific doctor.

```json
{
  "type": "function",
  "function": {
    "name": "get_available_slots",
    "description": "Get available time slots for a specific doctor on a specific date.",
    "parameters": {
      "type": "object",
      "properties": {
        "doctorId": {
          "type": "string",
          "description": "The ID of the doctor"
        },
        "date": {
          "type": "string",
          "description": "The date in YYYY-MM-DD format"
        }
      },
      "required": ["doctorId", "date"]
    }
  }
}
```

#### 3. get_appointment_types
Retrieves services and pricing.

```json
{
  "type": "function",
  "function": {
    "name": "get_appointment_types",
    "description": "Get the list of appointment types (services) offered by a doctor.",
    "parameters": {
      "type": "object",
      "properties": {
        "doctorId": {
          "type": "string",
          "description": "The ID of the doctor"
        }
      },
      "required": ["doctorId"]
    }
  }
}
```

#### 4. book_appointment
Finalizes the booking.

```json
{
  "type": "function",
  "function": {
    "name": "book_appointment",
    "description": "Book an appointment and send a payment link to the user.",
    "parameters": {
      "type": "object",
      "properties": {
        "doctorId": {
          "type": "string",
          "description": "The ID of the doctor"
        },
        "date": {
          "type": "string",
          "description": "The date in YYYY-MM-DD format"
        },
        "time": {
          "type": "string",
          "description": "The time in HH:mm format (24h)"
        },
        "appointmentTypeId": {
          "type": "string",
          "description": "The ID of the selected appointment type"
        },
        "email": {
          "type": "string",
          "description": "User's email address (if not already known)"
        },
        "phoneNumber": {
          "type": "string",
          "description": "User's phone number (if not calling from phone)"
        },
        "reason": {
          "type": "string",
          "description": "Reason for the visit"
        }
      },
      "required": ["doctorId", "date", "time", "appointmentTypeId"]
    }
  }
}
```

## 4. Testing

1.  **Local Testing:**
    *   Use `ngrok` to tunnel your localhost: `ngrok http 3000`.
    *   Update your VAPI Assistant's Tool Server URL to `https://<your-ngrok-url>/api/vapi/webhook`.
    *   Use the "Talk" button in the VAPI Dashboard to test.

2.  **Production Testing:**
    *   Deploy your application.
    *   Ensure `NEXT_PUBLIC_APP_URL` is set correctly in production environment variables.
    *   Update VAPI Tool Server URL to your production domain.

## 5. Troubleshooting

*   **"I couldn't find that function":** Ensure the tool names in VAPI match exactly with the `switch` cases in `route.ts`.
*   **"An error occurred":** Check your Vercel/Server logs. Common issues are database connection timeouts or missing environment variables.
*   **Timezone Issues:** The system expects `YYYY-MM-DD`. Ensure VAPI is passing the date correctly relative to the user's timezone (VAPI usually handles this if "Timezone" is set in the assistant settings).
