import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// Use built-in Helvetica font (no registration needed, always available)
// This avoids "Unknown font format" errors from URL-based font loading
const fontFamily = "Helvetica";

export interface AppointmentSummaryPdfProps {
  appointmentId: string;
  doctorName: string;
  doctorSpeciality?: string | null;
  doctorEmail?: string | null;
  doctorPhone?: string | null;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType?: string | null;
  duration?: string | null;
  location?: string | null;
  price?: string | null;
  paymentStatus: string;
  cancellationPolicy: string;
  additionalNotes?: string | null;
  generatedAt: string;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: fontFamily,
    padding: 32,
    fontSize: 11,
    lineHeight: 1.5,
    color: "#1f2937",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    color: "#6b7280",
  },
  value: {
    fontWeight: 600,
  },
  divider: {
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    marginVertical: 16,
  },
  footer: {
    fontSize: 9,
    color: "#9ca3af",
    marginTop: 24,
    textAlign: "center",
  },
});

export function AppointmentSummaryPdf({
  appointmentId,
  doctorName,
  doctorSpeciality,
  doctorEmail,
  doctorPhone,
  patientName,
  appointmentDate,
  appointmentTime,
  appointmentType,
  duration,
  location,
  price,
  paymentStatus,
  cancellationPolicy,
  additionalNotes,
  generatedAt,
}: AppointmentSummaryPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Appointment Confirmation</Text>
          <Text style={styles.subtitle}>Confirmation ID: {appointmentId}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Doctor</Text>
          <Text>{doctorName}</Text>
          {doctorSpeciality ? <Text>{doctorSpeciality}</Text> : null}
          {doctorEmail ? <Text>{doctorEmail}</Text> : null}
          {doctorPhone ? <Text>{doctorPhone}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient</Text>
          <Text>{patientName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{appointmentDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.value}>{appointmentTime}</Text>
          </View>
          {appointmentType ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Type</Text>
              <Text style={styles.value}>{appointmentType}</Text>
            </View>
          ) : null}
          {duration ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Duration</Text>
              <Text style={styles.value}>{duration}</Text>
            </View>
          ) : null}
          {location ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>{location}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{paymentStatus}</Text>
          </View>
          {price ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Amount</Text>
              <Text style={styles.value}>{price}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cancellation Policy</Text>
          <Text>{cancellationPolicy}</Text>
        </View>

        {additionalNotes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text>{additionalNotes}</Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        <Text style={styles.footer}>
          Generated on {generatedAt}. Please arrive 10 minutes early and bring a
          valid ID. For changes, contact support@medibook.com.
        </Text>
      </Page>
    </Document>
  );
}

export default AppointmentSummaryPdf;

