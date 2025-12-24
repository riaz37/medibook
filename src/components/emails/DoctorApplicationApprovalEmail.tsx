import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface DoctorApplicationApprovalEmailProps {
  doctorName?: string;
  speciality?: string;
}

export default function DoctorApplicationApprovalEmail({
  doctorName = "Doctor",
  speciality,
}: DoctorApplicationApprovalEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your doctor application has been approved!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Application Approved! 🎉</Heading>
          
          <Text style={text}>Dear {doctorName},</Text>
          
          <Text style={text}>
            We are pleased to inform you that your application to become a doctor on Medibook has been <strong>approved</strong>!
          </Text>

          {speciality && (
            <Section style={infoBox}>
              <Text style={infoText}>
                <strong>Speciality:</strong> {speciality}
              </Text>
            </Section>
          )}

          <Text style={text}>
            Your account has been upgraded to a verified doctor account. You now have full access to:
          </Text>

          <Section style={listSection}>
            <Text style={listItem}>✓ Manage your doctor profile and availability</Text>
            <Text style={listItem}>✓ Accept and manage patient appointments</Text>
            <Text style={listItem}>✓ Create and manage prescriptions</Text>
            <Text style={listItem}>✓ View your earnings and billing information</Text>
            <Text style={listItem}>✓ Access the doctor dashboard</Text>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/doctor/dashboard`}>
              Go to Doctor Dashboard
            </Button>
          </Section>

          <Text style={text}>
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </Text>

          <Text style={text}>
            Welcome to Medibook! We're excited to have you on board.
          </Text>

          <Text style={footer}>
            Best regards,<br />
            The Medibook Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  marginBottom: "16px",
};

const infoBox = {
  backgroundColor: "#e8f5e9",
  border: "1px solid #4caf50",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const infoText = {
  color: "#2e7d32",
  fontSize: "16px",
  margin: "0",
};

const listSection = {
  margin: "24px 0",
};

const listItem = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  marginBottom: "8px",
};

const buttonSection = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#0070f3",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
};

const footer = {
  color: "#898989",
  fontSize: "14px",
  lineHeight: "22px",
  marginTop: "32px",
};

