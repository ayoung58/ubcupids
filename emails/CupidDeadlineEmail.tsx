import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

/**
 * Cupid Deadline Reminder Email Template (React Email)
 *
 * Reminds cupids about the Feb 8 match reveal deadline
 * and encourages them to continue assigning matches before then.
 */

interface CupidDeadlineEmailProps {
  firstName: string | null;
}

export default function CupidDeadlineEmail({
  firstName = "there", // Default fallback
}: CupidDeadlineEmailProps) {
  return (
    <Html>
      <Head />
      {/* Preview text shown in email inbox */}
      <Preview>
        Important reminder: Match reveal is February 8th - Please assign matches
        before then!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo/Header */}
          <Heading style={h1}>💘 UBCupids</Heading>

          {/* Greeting */}
          <Text style={text}>Hi {firstName},</Text>

          {/* Main message */}
          <Text style={text}>
            Thank you for being a Cupid and helping create meaningful
            connections this Valentine&apos;s Day! 🏹
          </Text>

          <Text style={text}>
            We wanted to remind you that{" "}
            <strong>matches will be revealed on February 8th</strong>. While you
            can continue to assign matches after this date, please note that
            match users might not check their accounts as frequently after the
            reveal deadline.
          </Text>

          <Text style={text}>
            <strong>For the best chance of your matches being seen:</strong>
            <br />
            We encourage you to complete your match assignments{" "}
            <strong>before February 8th</strong>.
          </Text>

          <Text style={text}>
            We truly appreciate your dedication to making this Valentine&apos;s
            Day special for the UBC community! 💕 And by the way, there will be
            a way for match users to send you a message after the reveal
            deadline to let you know how they are doing! 💌
          </Text>

          {/* Footer */}
          <Text style={footer}>
            Questions or need help? Reply to this email or contact us at
            support@ubcupids.org
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

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "32px 24px 0",
  textAlign: "center" as const,
};
