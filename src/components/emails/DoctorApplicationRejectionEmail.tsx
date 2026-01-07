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

interface DoctorApplicationRejectionEmailProps {
  doctorName?: string;
  rejectionReason?: string;
}

export default function DoctorApplicationRejectionEmail({
  doctorName = "Doctor",
  rejectionReason,
}: DoctorApplicationRejectionEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Update on your doctor application</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Application Update</Heading>
          
          <Text style={text}>Dear {doctorName},</Text>
          
          <Text style={text}>
            Thank you for your interest in joining Medibook as a healthcare provider. After careful review of your application, we regret to inform you that we are unable to approve your application at this time.
          </Text>

          {rejectionReason && (
            <Section style={reasonBox}>
              <Text style={reasonTitle}>Reason:</Text>
              <Text style={reasonText}>{rejectionReason}</Text>
            </Section>
          )}

          <Text style={text}>
            We understand this may be disappointing. If you believe this decision was made in error, or if your circumstances have changed, you are welcome to submit a new application.
          </Text>

          <Section style={buttonSection}>
            <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/doctors/apply`}>
              Submit New Application
            </Button>
          </Section>

          <Text style={text}>
            If you have any questions about this decision or would like to discuss your application further, please contact our support team.
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

const reasonBox = {
  backgroundColor: "#fff3e0",
  border: "1px solid #ff9800",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const reasonTitle = {
  color: "#e65100",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "0 0 8px 0",
};

const reasonText = {
  color: "#e65100",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0",
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









