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

interface AppointmentRescheduleEmailProps {
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  oldDate: string;
  oldTime: string;
}

function AppointmentRescheduleEmail({
  doctorName,
  appointmentDate,
  appointmentTime,
  oldDate,
  oldTime,
}: AppointmentRescheduleEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your appointment has been rescheduled</Preview>
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

          <Heading style={h1}>Appointment Rescheduled 🗓️</Heading>

          <Text style={text}>Hi there,</Text>

          <Text style={text}>
            Your appointment with {doctorName} has been rescheduled.
          </Text>

          <Section style={appointmentDetails}>
            <Text style={detailLabel}>New Date</Text>
            <Text style={detailValue}>{appointmentDate}</Text>

            <Text style={detailLabel}>New Time</Text>
            <Text style={detailValue}>{appointmentTime}</Text>

            <Text style={detailLabel}>Previous Date</Text>
            <Text style={detailValue}>{oldDate}</Text>

            <Text style={detailLabel}>Previous Time</Text>
            <Text style={detailValue}>{oldTime}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Link style={button} href={process.env.NEXT_PUBLIC_APP_URL + "/appointments"}>
              View My Appointments
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

export default AppointmentRescheduleEmail;

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
  color: "#d97706", // Amber for reschedule
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

const appointmentDetails = {
  backgroundColor: "#fffbeb", // Light amber bg
  border: "1px solid #fcd34d",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const detailLabel = {
  color: "#92400e",
  fontSize: "14px",
  fontWeight: "500",
  margin: "8px 0 4px 0",
};

const detailValue = {
  color: "#78350f",
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
