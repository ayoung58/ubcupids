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

interface PasswordResetEmailProps {
  firstName: string | null;
  resetCode: string;
}

export default function PasswordResetEmail({
  firstName = "there",
  resetCode,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your password reset code: {resetCode}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>💘 UBCupids</Heading>

          <Text style={text}>Hi {firstName},</Text>

          <Text style={text}>
            We received a request to reset your password. Use the code below to
            reset your password:
          </Text>

          <Section style={codeContainer}>
            <Text style={codeText}>{resetCode}</Text>
          </Section>

          <Text style={text}>
            This code will expire in 1 hour. If you didn&apos;t request a
            password reset, you can safely ignore this email.
          </Text>

          <Text style={footer}>
            If you&apos;re having trouble, please contact support@ubcupids.org
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 24px 48px",
  marginBottom: "64px",
  maxWidth: "600px",
  boxSizing: "border-box" as const,
};

const h1 = {
  color: "#333",
  fontSize: "32px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "40px 0",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 24px",
};

const codeContainer = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  margin: "32px 0",
  padding: "24px",
  textAlign: "center" as const,
  width: "100%",
  boxSizing: "border-box" as const,
  maxWidth: "100%",
};

const codeText = {
  color: "#e63946",
  fontSize: "32px",
  fontWeight: "bold",
  letterSpacing: "8px",
  fontFamily: "monospace",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "32px 0 0",
  textAlign: "center" as const,
};
