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

interface PasswordResetEmailProps {
  resetLink: string;
  userName?: string;
  expiresIn: string;
}

function PasswordResetEmail({
  resetLink,
  userName,
  expiresIn = "1 hour",
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Medibook password</Preview>
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

          <Heading style={h1}>Reset Your Password</Heading>

          <Text style={text}>Hi{userName ? ` ${userName}` : ""},</Text>

          <Text style={text}>
            We received a request to reset your password for your Medibook account. 
            Click the button below to create a new password:
          </Text>

          <Section style={buttonContainer}>
            <Link style={button} href={resetLink}>
              Reset Password
            </Link>
          </Section>

          <Text style={text}>
            This link will expire in <strong>{expiresIn}</strong>. If you didn't 
            request a password reset, you can safely ignore this email.
          </Text>

          <Section style={warningBox}>
            <Text style={warningText}>
              ⚠️ If you didn't request this password reset, please ignore this email 
              or contact support if you have concerns about your account security.
            </Text>
          </Section>

          <Text style={footer}>
            Best regards,
            <br />
            The Medibook Team
          </Text>

          <Text style={footerText}>
            If you're having trouble clicking the button, copy and paste this URL 
            into your browser:
            <br />
            <Link href={resetLink} style={linkText}>{resetLink}</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordResetEmail;

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
  color: "#1f2937",
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

const warningBox = {
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const warningText = {
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
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

const linkText = {
  color: "#2563eb",
  fontSize: "12px",
  wordBreak: "break-all" as const,
};
