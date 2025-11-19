import React from "react";
import { pdf } from "@react-pdf/renderer";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import AppointmentSummaryPdf from "@/components/pdf/AppointmentSummaryPdf";

class PdfService {
  async generateAppointmentSummary(appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: true,
        user: true,
        payment: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    const appointmentType = appointment.appointmentTypeId
      ? await prisma.doctorAppointmentType.findUnique({
          where: { id: appointment.appointmentTypeId },
        })
      : null;

    const formattedDate = format(appointment.date, "EEEE, MMMM d, yyyy");
    const cancellationPolicy =
      "24+ hours before: full refund · 1-24 hours: 50% refund · Less than 1 hour or no-show: no refund.";

    const pdfDocument = (
      <AppointmentSummaryPdf
        appointmentId={appointment.id}
        doctorName={appointment.doctor.name}
        doctorSpeciality={appointment.doctor.speciality}
        doctorEmail={appointment.doctor.email}
        doctorPhone={appointment.doctor.phone}
        patientName={`${appointment.user.firstName || ""} ${
          appointment.user.lastName || ""
        }`.trim()}
        appointmentDate={formattedDate}
        appointmentTime={appointment.time}
        appointmentType={appointmentType?.name || appointment.reason || "General consultation"}
        duration={
          appointmentType?.duration
            ? `${appointmentType.duration} minutes`
            : `${appointment.duration} minutes`
        }
        location="Medical Center"
        price={
          appointment.payment
            ? `$${Number(appointment.payment.appointmentPrice).toFixed(2)}`
            : "TBD"
        }
        paymentStatus={appointment.payment?.status || "PENDING"}
        cancellationPolicy={cancellationPolicy}
        additionalNotes={appointment.notes}
        generatedAt={format(new Date(), "PPPpp")}
      />
    );

    const pdfBuffer = await pdf(pdfDocument).toBuffer();

    // Convert to Node.js Buffer - @react-pdf/renderer returns a Buffer or Uint8Array in Node.js
    let buffer: Buffer;
    if (Buffer.isBuffer(pdfBuffer)) {
      buffer = pdfBuffer;
    } else if (pdfBuffer instanceof Uint8Array) {
      buffer = Buffer.from(pdfBuffer);
    } else {
      // Fallback: handle ReadableStream (shouldn't happen in Node.js, but handle for type safety)
      const stream = pdfBuffer as unknown as ReadableStream<Uint8Array>;
      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }
      
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const merged = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      buffer = Buffer.from(merged);
    }

    return {
      buffer,
      filename: `medibook-appointment-${appointment.id}.pdf`,
    };
  }
}

export const pdfService = new PdfService();

