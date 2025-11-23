import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface AppointmentCancellationEmailProps {
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
}

function AppointmentCancellationEmail({
  doctorName,
  appointmentDate,
  appointmentTime,
  reason,
}: AppointmentCancellationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your appointment has been cancelled</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src="https://i.ibb.co.com/tRy6cC2/logo.png"
              width="50"
              height="50"
              alt="Medibook"
              style={logo}
            />
            <Text style={logoText}>Medibook</Text>
          </Section>

          <Heading style={h1}>Appointment Cancelled ❌</Heading>

          <Text style={text}>Hi there,</Text>

          <Text style={text}>
            Your appointment with {doctorName} scheduled for {appointmentDate} at {appointmentTime} has been cancelled.
          </Text>

          {reason && (
            <Section style={reasonContainer}>
              <Text style={detailLabel}>Reason for Cancellation</Text>
              <Text style={detailValue}>{reason}</Text>
            </Section>
          )}

          <Section style={buttonContainer}>
            <Link style={button} href={process.env.NEXT_PUBLIC_APP_URL + "/appointments"}>
              Book New Appointment
            </Link>
          </Section>

          <Text style={footer}>
            Best regards,
            <br />
            The Medibook Team
          </Text>

          <Text style={footerText}>
            If you have any questions, please contact us at support@medibook.com
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AppointmentCancellationEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const logoContainer = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const logo = {
  borderRadius: "8px",
  display: "inline",
  verticalAlign: "middle",
};

const logoText = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#2563eb",
  margin: "0",
  display: "inline",
  marginLeft: "12px",
};

const h1 = {
  color: "#ef4444", // Red for cancellation
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const reasonContainer = {
  backgroundColor: "#fef2f2", // Light red bg
  border: "1px solid #fee2e2",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const detailLabel = {
  color: "#991b1b",
  fontSize: "14px",
  fontWeight: "500",
  margin: "8px 0 4px 0",
};

const detailValue = {
  color: "#7f1d1d",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footer = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "32px 0 16px 0",
};

const footerText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "16px 0 0 0",
  textAlign: "center" as const,
};
