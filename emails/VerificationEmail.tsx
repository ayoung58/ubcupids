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

/**
 * Email Verification Template (React Email)
 *
 * React Email benefits:
 * - Write emails in React (familiar syntax)
 * - Automatic responsive design
 * - Cross-client compatibility (Gmail, Outlook, Apple Mail, etc.)
 * - Preview emails locally: npm run email (optional)
 *
 * Design principles:
 * - Clear call-to-action button
 * - Fallback link (if button doesn't work)
 * - Expiry notice (24 hours)
 * - Brand-consistent styling
 * - Mobile-friendly (responsive)
 */

interface VerificationEmailProps {
  firstName: string | null;
  verificationUrl: string;
}

export default function VerificationEmail({
  firstName = "there", // Default fallback
  verificationUrl,
}: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      {/* Preview text shown in email inbox */}
      <Preview>Verify your UBCupids account to start matching!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo/Header */}
          <Heading style={h1}>💘 UBCupids</Heading>

          {/* Greeting */}
          <Text style={text}>Hi {firstName},</Text>

          {/* Main message */}
          <Text style={text}>
            Welcome to UBCupids! Click the button below to verify your email
            address and activate your account.
          </Text>

          {/* Call-to-action button */}
          <Section style={buttonContainer}>
            <Button style={button} href={verificationUrl}>
              Verify Email Address
            </Button>
          </Section>

          {/* Fallback link (if button doesn't render) */}
          <Text style={text}>
            Or copy and paste this link into your browser:
          </Text>
          <Link href={verificationUrl} style={link}>
            {verificationUrl}
          </Link>

          {/* Expiry notice */}
          <Text style={text}>
            This link will expire in 24 hours. If you didn&apos;t create a
            UBCupids account, you can safely ignore this email.
          </Text>

          {/* Footer */}
          <Text style={footer}>
            Need help? Reply to this email or contact us at support@ubcupids.com
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================
// STYLES (Inline CSS for email compatibility)
// ============================================

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
  maxWidth: "600px",
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

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#e63946", // UBCupids brand red (Valentine's theme)
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const link = {
  color: "#e63946",
  fontSize: "14px",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
  margin: "0 24px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "32px 24px 0",
  textAlign: "center" as const,
};
