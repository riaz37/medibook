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

interface EmailVerificationEmailProps {
  verificationLink: string;
  verificationCode?: string;
  userName?: string;
  expiresIn: string;
}

function EmailVerificationEmail({
  verificationLink,
  verificationCode,
  userName,
  expiresIn = "24 hours",
}: EmailVerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your Medibook email address</Preview>
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

          <Heading style={h1}>Verify Your Email Address</Heading>

          <Text style={text}>Hi{userName ? ` ${userName}` : ""},</Text>

          <Text style={text}>
            Welcome to Medibook! Please verify your email address to complete your 
            registration and start booking appointments with our healthcare providers.
          </Text>

          <Section style={buttonContainer}>
            <Link style={button} href={verificationLink}>
              Verify Email Address
            </Link>
          </Section>

          {verificationCode && (
            <Section style={codeContainer}>
              <Text style={codeLabel}>Or enter this verification code:</Text>
              <Text style={code}>{verificationCode}</Text>
            </Section>
          )}

          <Text style={text}>
            This verification link will expire in <strong>{expiresIn}</strong>.
          </Text>

          <Section style={benefitsBox}>
            <Text style={benefitsTitle}>Once verified, you can:</Text>
            <Text style={benefitItem}>✓ Book appointments with doctors</Text>
            <Text style={benefitItem}>✓ Access your medical records</Text>
            <Text style={benefitItem}>✓ Receive prescription notifications</Text>
            <Text style={benefitItem}>✓ Use our AI health assistant</Text>
          </Section>

          <Text style={footer}>
            Best regards,
            <br />
            The Medibook Team
          </Text>

          <Text style={footerText}>
            If you didn't create an account with Medibook, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default EmailVerificationEmail;

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
  backgroundColor: "#10b981",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const codeContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const codeLabel = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0 0 8px 0",
};

const code = {
  backgroundColor: "#f3f4f6",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  color: "#1f2937",
  fontSize: "32px",
  fontWeight: "bold",
  letterSpacing: "8px",
  padding: "16px 24px",
  display: "inline-block",
  margin: "0",
};

const benefitsBox = {
  backgroundColor: "#ecfdf5",
  border: "1px solid #10b981",
  borderRadius: "8px",
  padding: "16px 24px",
  margin: "24px 0",
};

const benefitsTitle = {
  color: "#065f46",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 12px 0",
};

const benefitItem = {
  color: "#047857",
  fontSize: "14px",
  lineHeight: "24px",
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
