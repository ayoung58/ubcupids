import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

/**
 * Cupid Feedback Email Template
 *
 * Sent to cupids when someone they matched sends them feedback
 */

interface CupidFeedbackEmailProps {
  cupidFirstName: string;
  senderDisplayName: string;
  message: string;
}

export default function CupidFeedbackEmail({
  cupidFirstName = "there",
  senderDisplayName = "Someone",
  message,
}: CupidFeedbackEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>A message from someone you matched! 💘</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>💘 UBCupids</Heading>

          <Heading style={h2}>A message from someone you matched!</Heading>

          <Text style={text}>Hi {cupidFirstName},</Text>

          <Text style={text}>
            {senderDisplayName} sent you a message about their match experience:
          </Text>

          <Section style={messageBox}>
            <Text style={messageText}>{message}</Text>
          </Section>

          <Text style={text}>
            Thank you for being a cupid and helping create connections! 💕
          </Text>

          <Text style={footer}>
            UBCupids Team
            <br />
            Making Valentine&apos;s Day special at UBC
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
  padding: "20px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const h1 = {
  color: "#ec4899",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "40px 0 20px 0",
  textAlign: "center" as const,
};

const h2 = {
  color: "#1e293b",
  fontSize: "24px",
  fontWeight: "600",
  margin: "20px 0",
  textAlign: "center" as const,
};

const text = {
  color: "#334155",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const messageBox = {
  backgroundColor: "#f1f5f9",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  border: "1px solid #e2e8f0",
  boxSizing: "border-box" as const,
};

const messageText = {
  color: "#1e293b",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
  wordBreak: "break-word" as const,
  overflowWrap: "break-word" as const,
};

const footer = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "32px 0 0 0",
  textAlign: "center" as const,
};
