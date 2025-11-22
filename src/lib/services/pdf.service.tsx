import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { format } from "date-fns";
import prisma from "@/lib/prisma";
import AppointmentSummaryPdf from "@/components/pdf/AppointmentSummaryPdf";
import { PrescriptionPdf } from "@/components/pdf/PrescriptionPdf";

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

    // Use renderToStream() for Node.js server-side rendering (per react-pdf docs)
    const pdfStream = await renderToStream(pdfDocument);

    // Convert Node.js Stream to Buffer
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];

      pdfStream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      pdfStream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      pdfStream.on("error", (error: Error) => {
        reject(error);
      });
    });

    return {
      buffer,
      filename: `medibook-appointment-${appointment.id}.pdf`,
    };
  }
}

export const pdfService = new PdfService();

/**
 * Generate a PDF buffer for a prescription
 * @param prescription - Prescription object with all related data (doctor, patient, items, etc.)
 * @returns Promise<Buffer> - PDF buffer
 */
export async function generatePrescriptionPDF(prescription: {
  id: string;
  doctor: {
    name: string;
    email: string | null;
    phone: string | null;
    speciality: string | null;
  };
  patient: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  };
  issueDate: Date;
  expiryDate: Date | null;
  status: string;
  notes: string | null;
  items: Array<{
    medication: {
      name: string;
    } | null;
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string | null;
    quantity: number | null;
    refillsAllowed: number;
    refillsRemaining: number;
  }>;
}): Promise<Buffer> {
  const patientName = `${prescription.patient.firstName || ""} ${
    prescription.patient.lastName || ""
  }`.trim();

  const pdfDocument = (
    <PrescriptionPdf
      prescriptionId={prescription.id}
      doctorName={prescription.doctor.name}
      doctorSpeciality={prescription.doctor.speciality}
      doctorEmail={prescription.doctor.email}
      doctorPhone={prescription.doctor.phone}
      patientName={patientName}
      patientEmail={prescription.patient.email}
      issueDate={format(prescription.issueDate, "PPP")}
      expiryDate={
        prescription.expiryDate
          ? format(prescription.expiryDate, "PPP")
          : null
      }
      status={prescription.status}
      notes={prescription.notes}
      items={prescription.items.map((item) => ({
        medicationName: item.medication?.name || item.medicationName,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.instructions,
        quantity: item.quantity,
        refillsAllowed: item.refillsAllowed,
        refillsRemaining: item.refillsRemaining,
      }))}
      generatedAt={format(new Date(), "PPPpp")}
    />
  );

  // Use renderToStream() for Node.js server-side rendering
  const pdfStream = await renderToStream(pdfDocument);

  // Convert Node.js Stream to Buffer
  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    pdfStream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    pdfStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    pdfStream.on("error", (error: Error) => {
      reject(error);
    });
  });

  return buffer;
}

