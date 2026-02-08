import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

/**
 * Match Reveal Announcement Email Template (React Email)
 *
 * Announces that matches have been revealed and provides important information
 * about cupid match updates, statistics, and feedback forms.
 */

interface MatchRevealEmailProps {
  firstName: string | null;
}

export default function MatchRevealEmail({
  firstName = "there", // Default fallback
}: MatchRevealEmailProps) {
  return (
    <Html>
      <Head />
      {/* Preview text shown in email inbox */}
      <Preview>
        Your UBCupids matches have been revealed! Check your dashboard now.
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo/Header */}
          <Heading style={h1}>💘 UBCupids</Heading>

          {/* Greeting */}
          <Text style={text}>Hi {firstName},</Text>

          {/* Main message */}
          <Text style={text}>
            <strong>Your matches have been revealed!</strong> 🎉 Head to your
            dashboard to see who you&apos;ve been matched with this
            Valentine&apos;s Day.
          </Text>

          {/* Important Updates Section */}
          <Text style={sectionHeading}>📌 Important Updates:</Text>

          <Text style={text}>
            <strong>Cupid Match Updates:</strong> Some cupids have not yet
            selected matches for their candidates. If you&apos;re a cupid, you
            can continue to assign and update matches until{" "}
            <strong>February 14th</strong>. Match users will be able to see any
            updates you make!
          </Text>

          {/* If No Match Section */}
          <Text style={text}>
            <strong>If you didn&apos;t receive a match:</strong> We&apos;re
            really sorry about that.This can happen due to several reasons:
          </Text>
          <ul style={list}>
            <li style={listItem}>
              Dealbreakers that were set by you or potential matches
            </li>
            <li style={listItem}>
              The smaller number of participants during our first year
            </li>
            <li style={listItem}>
              In very rare cases, limitations of the matching algorithm
            </li>
          </ul>

          {/* Statistics Section */}
          <Text style={text}>
            <strong>Statistics Page:</strong> Our statistics page will be live
            very soon! Check back to see some interesting insights about this
            year&apos;s matches.
          </Text>

          {/* Feedback Section */}
          <Text style={text}>
            <strong>Share Your Feedback:</strong> Your feedback helps us
            improve! Complete our{" "}
            <Link href="https://ubcupids.org/feedback" style={link}>
              feedback form
            </Link>{" "}
            for a chance to win one of three{" "}
            <strong>$10 Amazon gift cards</strong>!
          </Text>

          {/* Thank You */}
          <Text style={text}>
            <strong>Thank you all for participating!</strong> We hope you found
            meaningful connections, or at least had a bit of fun.
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

const sectionHeading = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "bold",
  lineHeight: "26px",
  margin: "24px 24px 8px",
};

const list = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "8px 24px 16px 48px",
  paddingLeft: "0",
};

const listItem = {
  marginBottom: "8px",
};

const link = {
  color: "#e91e63",
  textDecoration: "underline",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "32px 24px 0",
  textAlign: "center" as const,
};
