import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const fontFamily = "Helvetica";

export interface PrescriptionPdfProps {
  prescriptionId: string;
  doctorName: string;
  doctorSpeciality?: string | null;
  doctorEmail?: string | null;
  doctorPhone?: string | null;
  doctorLicense?: string | null;
  patientName: string;
  patientEmail?: string | null;
  issueDate: string;
  expiryDate?: string | null;
  status: string;
  notes?: string | null;
  items: Array<{
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string | null;
    quantity?: number | null;
    refillsAllowed: number;
    refillsRemaining: number;
  }>;
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
    borderBottomWidth: 2,
    borderBottomColor: "#1f2937",
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "center",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
    color: "#1f2937",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    color: "#6b7280",
    width: 100,
  },
  value: {
    fontWeight: 500,
    flex: 1,
  },
  medicationItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  medicationName: {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 6,
    color: "#1f2937",
  },
  medicationDetail: {
    flexDirection: "row",
    marginBottom: 4,
  },
  medicationLabel: {
    color: "#6b7280",
    width: 80,
    fontSize: 10,
  },
  medicationValue: {
    fontSize: 10,
    flex: 1,
  },
  instructions: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    fontSize: 10,
    fontStyle: "italic",
    color: "#4b5563",
  },
  notes: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fef3c7",
    borderRadius: 4,
    fontSize: 10,
  },
  footer: {
    fontSize: 9,
    color: "#9ca3af",
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    textAlign: "center",
  },
  warning: {
    fontSize: 9,
    color: "#dc2626",
    marginTop: 12,
    padding: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 4,
    textAlign: "center",
  },
});

export function PrescriptionPdf({
  prescriptionId,
  doctorName,
  doctorSpeciality,
  doctorEmail,
  doctorPhone,
  patientName,
  issueDate,
  expiryDate,
  status,
  notes,
  items,
  generatedAt,
}: PrescriptionPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>PRESCRIPTION</Text>
          <Text style={styles.subtitle}>Prescription ID: {prescriptionId}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prescribing Physician</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{doctorName}</Text>
          </View>
          {doctorSpeciality && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Speciality:</Text>
              <Text style={styles.value}>{doctorSpeciality}</Text>
            </View>
          )}
          {doctorPhone && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{doctorPhone}</Text>
            </View>
          )}
          {doctorEmail && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{doctorEmail}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{patientName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Issue Date:</Text>
            <Text style={styles.value}>{issueDate}</Text>
          </View>
          {expiryDate && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Expiry Date:</Text>
              <Text style={styles.value}>{expiryDate}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medications</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.medicationItem}>
              <Text style={styles.medicationName}>
                {index + 1}. {item.medicationName}
              </Text>
              <View style={styles.medicationDetail}>
                <Text style={styles.medicationLabel}>Dosage:</Text>
                <Text style={styles.medicationValue}>{item.dosage}</Text>
              </View>
              <View style={styles.medicationDetail}>
                <Text style={styles.medicationLabel}>Frequency:</Text>
                <Text style={styles.medicationValue}>{item.frequency}</Text>
              </View>
              <View style={styles.medicationDetail}>
                <Text style={styles.medicationLabel}>Duration:</Text>
                <Text style={styles.medicationValue}>{item.duration}</Text>
              </View>
              {item.quantity && (
                <View style={styles.medicationDetail}>
                  <Text style={styles.medicationLabel}>Quantity:</Text>
                  <Text style={styles.medicationValue}>{item.quantity}</Text>
                </View>
              )}
              <View style={styles.medicationDetail}>
                <Text style={styles.medicationLabel}>Refills:</Text>
                <Text style={styles.medicationValue}>
                  {item.refillsRemaining} of {item.refillsAllowed} remaining
                </Text>
              </View>
              {item.instructions && (
                <View style={styles.instructions}>
                  <Text style={styles.medicationLabel}>Instructions:</Text>
                  <Text>{item.instructions}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <View style={styles.notes}>
              <Text>{notes}</Text>
            </View>
          </View>
        )}

        <View style={styles.warning}>
          <Text>
            IMPORTANT: This prescription is valid only when issued by a licensed
            physician. Follow all instructions carefully and consult your doctor
            if you have any questions or experience adverse effects.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>
            Generated on {generatedAt}. This is a digital prescription. For
            questions, contact your prescribing physician.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default PrescriptionPdf;

