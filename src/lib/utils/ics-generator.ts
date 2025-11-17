/**
 * ICS (iCalendar) File Generator
 * Generates .ics files for calendar applications
 */

interface AppointmentEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  doctorName: string;
  doctorEmail?: string;
  patientName: string;
  patientEmail: string;
}

/**
 * Escape text for ICS format
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Format date for ICS (YYYYMMDDTHHmmssZ)
 */
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate ICS file content for a single appointment
 */
export function generateICS(event: AppointmentEvent): string {
  const lines: string[] = [];

  // ICS Header
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Medibook//Appointment Booking//EN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:REQUEST");

  // Event
  lines.push("BEGIN:VEVENT");
  lines.push(`UID:${event.id}@medibook.app`);
  lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
  lines.push(`DTSTART:${formatICSDate(event.startDate)}`);
  lines.push(`DTEND:${formatICSDate(event.endDate)}`);
  lines.push(`SUMMARY:${escapeICS(event.title)}`);
  lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
  
  if (event.location) {
    lines.push(`LOCATION:${escapeICS(event.location)}`);
  }

  // Organizer (Doctor)
  if (event.doctorEmail) {
    lines.push(`ORGANIZER;CN=${escapeICS(event.doctorName)}:MAILTO:${event.doctorEmail}`);
  }

  // Attendee (Patient)
  lines.push(`ATTENDEE;CN=${escapeICS(event.patientName)};RSVP=TRUE:MAILTO:${event.patientEmail}`);

  // Status
  lines.push("STATUS:CONFIRMED");
  lines.push("SEQUENCE:0");
  lines.push("END:VEVENT");

  // Footer
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Generate ICS file content for multiple appointments
 */
export function generateMultiAppointmentICS(events: AppointmentEvent[]): string {
  const lines: string[] = [];

  // ICS Header
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Medibook//Appointment Booking//EN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");

  // Add each event
  for (const event of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.id}@medibook.app`);
    lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
    lines.push(`DTSTART:${formatICSDate(event.startDate)}`);
    lines.push(`DTEND:${formatICSDate(event.endDate)}`);
    lines.push(`SUMMARY:${escapeICS(event.title)}`);
    lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
    
    if (event.location) {
      lines.push(`LOCATION:${escapeICS(event.location)}`);
    }

    if (event.doctorEmail) {
      lines.push(`ORGANIZER;CN=${escapeICS(event.doctorName)}:MAILTO:${event.doctorEmail}`);
    }

    lines.push(`ATTENDEE;CN=${escapeICS(event.patientName)};RSVP=TRUE:MAILTO:${event.patientEmail}`);
    lines.push("STATUS:CONFIRMED");
    lines.push("SEQUENCE:0");
    lines.push("END:VEVENT");
  }

  // Footer
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

