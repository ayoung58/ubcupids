import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Privacy Notice & Terms | UBCupids",
  description:
    "Privacy Notice, Terms of Service, and Data Protection Policy for UBCupids",
};

export default function PrivacyAndTermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 relative min-h-[72px] flex items-center justify-center">
          {/* Back Button */}
          <div className="absolute left-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="hover:bg-slate-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Logo - Centered */}
          <div className="flex justify-center">
            <Link
              href="/"
              className="text-3xl font-bold text-slate-900 hover:text-slate-700 transition-colors"
            >
              💘 UBCupids
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 space-y-8">
          {/* Title */}
          <div className="border-b pb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Privacy Notice & Terms of Service
            </h1>
            <p className="text-sm text-slate-500">
              Last Updated: January 4, 2026
            </p>
          </div>

          {/* Table of Contents */}
          <nav className="bg-slate-50 rounded-lg p-6">
            <h2 className="font-semibold text-slate-900 mb-3">
              Quick Navigation
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#about" className="text-pink-600 hover:underline">
                  1. About UBCupids
                </a>
              </li>
              <li>
                <a href="#principles" className="text-pink-600 hover:underline">
                  2. Data Principles
                </a>
              </li>
              <li>
                <a
                  href="#information"
                  className="text-pink-600 hover:underline"
                >
                  3. Information We Collect
                </a>
              </li>
              <li>
                <a href="#usage" className="text-pink-600 hover:underline">
                  4. How We Use Your Data
                </a>
              </li>
              <li>
                <a href="#protection" className="text-pink-600 hover:underline">
                  5. Data Protection & Encryption
                </a>
              </li>
              <li>
                <a href="#rights" className="text-pink-600 hover:underline">
                  6. Your Rights
                </a>
              </li>
              <li>
                <a href="#terms" className="text-pink-600 hover:underline">
                  7. Terms of Service
                </a>
              </li>
              <li>
                <a href="#contact" className="text-pink-600 hover:underline">
                  8. Contact Us
                </a>
              </li>
            </ul>
          </nav>

          {/* Section 1: About UBCupids */}
          <section id="about" className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">
              1. About UBCupids
            </h2>
            <p className="text-slate-700 leading-relaxed">
              UBCupids is a student-run Valentine&apos;s Day matchmaking service
              for the University of British Columbia community. We use
              compatibility questionnaires and human cupids to create meaningful
              connections between UBC students.
            </p>
            <p className="text-slate-700 leading-relaxed">
              By using our service at{" "}
              <span className="font-semibold">UBCupids</span>, you agree to the
              practices set forth in this Privacy Notice and Terms of Service.
            </p>
          </section>

          {/* Section 2: Data Principles */}
          <section id="principles" className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">
              2. Our Data Principles
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  2.1 Your Privacy Is Not For Sale
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    We will never sell your personal data to third parties
                  </li>
                  <li>
                    We do not engage in targeted advertising or psychological
                    influence operations
                  </li>
                  <li>
                    Your contact information is only used for UBCupids-related
                    communications
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  2.2 Security First
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    All sensitive data is encrypted using industry-standard
                    AES-256-GCM encryption
                  </li>
                  <li>Passwords are hashed using bcrypt before storage</li>
                  <li>
                    We implement strict access controls and security measures
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  2.3 Transparency & Accountability
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    We are clear about what data we collect and how we use it
                  </li>
                  <li>
                    You have the right to access, modify, and delete your data
                  </li>
                  <li>You can contact us about any concerns</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  2.4 Voluntary Participation
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>Your participation is completely voluntary</li>
                  <li>
                    You can delete your account at any time (though it would be
                    appreciated by others if you do so before matching begins)
                  </li>
                  <li>
                    After matches are released, you choose whether to accept or
                    decline connections
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3: Information Collection */}
          <section id="information" className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">
              3. Information We Collect
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  3.1 Account Information
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    <strong>Contact Information:</strong> First name, last name,
                    UBC email address (@student.ubc.ca or @alumni.ubc.ca)
                  </li>
                  <li>
                    <strong>Authentication:</strong> Password (hashed with
                    bcrypt)
                  </li>
                  <li>
                    <strong>Account Type:</strong> Match candidate, cupid, or
                    both
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  3.2 Profile Information (Match Candidates)
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    <strong>Basic Information:</strong> Display name, age, major
                    (optional), profile picture (optional)
                  </li>
                  <li>
                    <strong>Personal Information:</strong> Interests, bio, point
                    of contact (e.g., social media handle)
                  </li>
                  <li>
                    <strong>Privacy Settings:</strong> Your preferences for what
                    information to share with matches
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  3.3 Questionnaire Responses
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    <strong>Demographics:</strong> Gender identity, sexual
                    orientation, matching preferences
                  </li>
                  <li>
                    <strong>Compatibility Questions:</strong> Values, beliefs,
                    lifestyle preferences, relationship goals
                  </li>
                  <li>
                    <strong>Importance Ratings:</strong> How important each
                    question is to you (1-5 scale)
                  </li>
                  <li>
                    <strong>Open-Ended Responses:</strong> Text responses about
                    interests, hobbies, and personality
                  </li>
                </ul>
                {/* <p className="text-sm text-slate-600 italic mt-2">
                  ⚠️ All questionnaire data is encrypted at rest using
                  AES-256-GCM encryption. Only the matching algorithm and
                  assigned cupids can access this data.
                </p> */}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  3.4 Cupid Information
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    <strong>Cupid Display Name:</strong> Name shown when making
                    matches
                  </li>
                  <li>
                    <strong>Preferred Candidate:</strong> Optional email of
                    someone you&apos;d like to help match
                  </li>
                  <li>
                    <strong>Approval Status:</strong> Whether you&apos;ve been
                    approved as a cupid
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  3.5 Technical Information
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    <strong>Session Data:</strong> Authentication tokens, login
                    timestamps
                  </li>
                  <li>
                    <strong>Usage Analytics:</strong> Page visits, feature usage
                    (via Vercel Analytics)
                  </li>
                  <li>
                    <strong>Device Information:</strong> Browser type, IP
                    address (for security purposes)
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4: Data Usage */}
          <section id="usage" className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">
              4. How We Use Your Data
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  4.1 Matching Algorithm
                </h3>
                <p className="text-slate-700">
                  Your questionnaire responses and demographic information are
                  used by our matching algorithm to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    Calculate compatibility scores with other participants
                  </li>
                  <li>Apply hard filters (gender preferences, age ranges)</li>
                  <li>Generate potential matches per match candidate</li>
                  <li>
                    Provide match rationale based on shared values and interests
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  4.2 Cupid Assignments
                </h3>
                <p className="text-slate-700">
                  Match candidate profiles and questionnaire responses are
                  shared with assigned cupids to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    Review compatibility between candidates and potential
                    matches
                  </li>
                  <li>Make informed matching decisions</li>
                  <li>Provide personalized rationale for each match</li>
                </ul>
                <p className="text-sm text-slate-600 italic mt-2">
                  ⚠️ Cupids agree to keep all information private, as per terms
                  and conditions.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  4.3 Communication
                </h3>
                <p className="text-slate-700">
                  We use your email address to send:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    <strong>Account notifications:</strong> Email verification,
                    password resets, security alerts
                  </li>
                  <li>
                    <strong>Project updates:</strong> Important announcements
                    about timelines and deadlines
                  </li>
                  <li>
                    <strong>Match results:</strong> Notification when your
                    matches are ready
                  </li>
                  <li>
                    <strong>Tutorial content:</strong> Guidance on using the
                    platform
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  4.4 Service Improvement
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>Analyze usage patterns to improve user experience</li>
                  <li>Identify and fix technical issues</li>
                  <li>Prevent fraud and maintain platform security</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  4.5 What We DON&apos;T Do With Your Data
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>Sell or rent your personal information</li>
                  <li>Share your data with advertisers or marketers</li>
                  <li>Use social media scraping or external data sources</li>
                  <li>Train AI models on your questionnaire responses</li>
                  <li>Share individually identifiable information publicly</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5: Data Protection */}
          <section id="protection" className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">
              5. Data Protection & Encryption
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  5.1 Security Standards
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <p className="font-semibold text-blue-900">
                    Industry-Standard Security
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-slate-700 text-sm">
                    <li>
                      <strong>Bcrypt Hashing:</strong> Passwords are hashed with
                      bcrypt (cost factor 10) before storage - your passwords
                      are never stored in plain text
                    </li>
                    <li>
                      <strong>Database Access Controls:</strong> Strict access
                      controls limit who can view user data
                    </li>
                    <li>
                      <strong>Secure Infrastructure:</strong> All data
                      transmission uses HTTPS encryption (TLS/SSL)
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  5.2 Infrastructure Security
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    <strong>Hosting:</strong> Secure cloud infrastructure with
                    automated backups
                  </li>
                  <li>
                    <strong>HTTPS:</strong> All data transmission is encrypted
                    via TLS/SSL
                  </li>
                  <li>
                    <strong>Access Controls:</strong> Role-based access with
                    minimal privilege principles
                  </li>
                  <li>
                    <strong>Monitoring:</strong> Automated security monitoring
                    and alerting
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  5.3 Data Retention
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    <strong>Active Period:</strong> Data is retained throughout
                    the UBCupids 2026 cycle
                  </li>
                  <li>
                    <strong>Post-Event:</strong> Match data and communications
                    are deleted within 6 months after Valentine&apos;s Day
                  </li>
                  <li>
                    <strong>Incomplete Responses:</strong> Draft questionnaires
                    that are never submitted are automatically deleted
                  </li>
                  <li>
                    <strong>Deleted Accounts:</strong> When you delete your
                    account, all personal data is permanently removed from our
                    systems
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  5.4 Security Incident Response
                </h3>
                <p className="text-slate-700">
                  In the unlikely event of a security incident:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    We will notify affected users as soon as we become aware of
                    the incident
                  </li>
                  <li>
                    We will provide clear information about what data may have
                    been affected
                  </li>
                  <li>
                    We will take immediate steps to secure systems and prevent
                    further issues
                  </li>
                  <li>
                    Users should report any suspicious activity to
                    support@ubcupids.org immediately
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 6: Your Rights */}
          <section id="rights" className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">
              6. Your Rights
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  6.1 Access Your Data
                </h3>
                <p className="text-slate-700">
                  You can access your account information, profile, and
                  questionnaire responses at any time by logging into your
                  UBCupids account.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  6.2 Modify Your Information
                </h3>
                <p className="text-slate-700">
                  You can edit your profile information, questionnaire responses
                  (before submission deadline), and privacy settings through
                  your account dashboard.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  6.3 Delete Your Account
                </h3>
                <p className="text-slate-700">
                  You have the right to delete your account and all associated
                  data:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    <strong>Before Matching:</strong> You can delete your
                    account at any time before the matching algorithm runs
                  </li>
                  <li>
                    <strong>After Matching:</strong> You can delete individual
                    account types (match or cupid) or your entire account
                  </li>
                  <li>
                    <strong>Complete Deletion:</strong> When deleted, your data
                    is permanently removed from our systems
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  6.4 Data Portability
                </h3>
                <p className="text-slate-700">
                  You can request a copy of your data in a portable format.
                  Contact us to make this request.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  6.5 Opt-Out Rights
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>You can opt out of non-essential emails at any time</li>
                  <li>
                    You can adjust privacy settings to control what information
                    is shared with matches
                  </li>
                  <li>You can decline matches without consequence</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 7: Terms of Service */}
          <section id="terms" className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">
              7. Terms of Service
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  7.1 Eligibility
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    You must be a current student or alumni of the University of
                    British Columbia
                  </li>
                  <li>
                    You must have a valid UBC email address (@student.ubc.ca or
                    @alumni.ubc.ca)
                  </li>
                  <li>You must be at least 18 years old</li>
                  <li>
                    You must provide accurate information during registration
                    (especially age)
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  7.2 Account Responsibilities
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    You are responsible for maintaining the confidentiality of
                    your account credentials
                  </li>
                  <li>You must not share your account with others</li>
                  <li>
                    You must notify us immediately of any unauthorized access to
                    your account
                  </li>
                  <li>You may create only one account per email address</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  7.3 Acceptable Use
                </h3>
                <p className="text-slate-700 mb-2">You agree NOT to:</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>Provide false or misleading information</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Use the service for commercial purposes or spam</li>
                  <li>
                    Attempt to hack, scrape, or reverse-engineer the platform
                  </li>
                  <li>Create multiple accounts to game the system</li>
                  <li>
                    Share other users&apos; personal information without consent
                  </li>
                  <li>
                    Use hate speech, discriminatory language, or explicit
                    content
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  7.4 Match Candidate Obligations
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>Complete the questionnaire honestly and thoughtfully</li>
                  <li>
                    Submit your questionnaire before the January 31, 2026
                    deadline
                  </li>
                  <li>
                    Understand that matches are final once revealed (you can
                    decline, but not request changes)
                  </li>
                  <li>
                    Treat your matches with respect regardless of whether you
                    accept or decline
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  7.5 Cupid Obligations
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    Maintain strict confidentiality about all candidate
                    information
                  </li>
                  <li>Make matching decisions thoughtfully and without bias</li>
                  <li>
                    Complete assigned matching tasks by required deadlines
                  </li>
                  <li>Provide helpful rationale for each match selection</li>
                  <li>
                    Never share candidate information outside the platform
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  7.6 No Guarantees
                </h3>
                <p className="text-slate-700">
                  UBCupids is provided &quot;as is&quot; without warranties:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>We do not guarantee you will receive matches</li>
                  <li>We do not guarantee match quality or compatibility</li>
                  <li>
                    We are not responsible for user interactions outside the
                    platform
                  </li>
                  <li>
                    We do not guarantee uninterrupted service or error-free
                    operation
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  7.7 Limitation of Liability
                </h3>
                <p className="text-slate-700">
                  To the maximum extent permitted by law:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    UBCupids is not liable for any indirect, incidental, or
                    consequential damages
                  </li>
                  <li>
                    We are not responsible for the actions or conduct of users
                  </li>
                  <li>
                    We are not liable for any romantic, emotional, or personal
                    outcomes
                  </li>
                  <li>
                    Our total liability is limited to the amount you paid to use
                    the service ($0)
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  7.8 Account Termination
                </h3>
                <p className="text-slate-700">
                  We reserve the right to suspend or terminate accounts that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>Violate these terms of service</li>
                  <li>Engage in abusive or harmful behavior</li>
                  <li>Provide false information</li>
                  <li>Compromise platform security or integrity</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  7.9 Important Deadlines
                </h3>
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <ul className="list-disc pl-6 space-y-2 text-slate-700">
                    <li>
                      <strong>Registration Closes:</strong> January 31, 2026 at
                      11:59 PM PST
                    </li>
                    <li>
                      <strong>Questionnaire Submission:</strong> January 31,
                      2026 at 11:59 PM PST
                    </li>
                    <li>
                      <strong>Account Linking Deadline:</strong> January 31,
                      2026 at 11:59 PM PST
                    </li>
                  </ul>
                  <p className="text-sm text-pink-700 mt-2 italic">
                    After these deadlines, you cannot create new accounts,
                    submit questionnaires, or link additional account types.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  7.10 Changes to Terms
                </h3>
                <p className="text-slate-700">
                  We may update these terms from time to time. If we make
                  significant changes, we will notify you via email. Continued
                  use of the service after changes constitutes acceptance of the
                  new terms.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  7.11 Governing Law
                </h3>
                <p className="text-slate-700">
                  These terms are governed by the laws of British Columbia,
                  Canada. Any disputes will be resolved in the courts of British
                  Columbia.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Contact */}
          <section id="contact" className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">8. Contact Us</h2>
            <div className="bg-slate-50 rounded-lg p-6 space-y-4">
              <p className="text-slate-700">
                If you have questions, concerns, or requests regarding your
                privacy or these terms:
              </p>
              <div className="space-y-2">
                <p className="text-slate-700">
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:support@ubcupids.org"
                    className="text-pink-600 hover:underline"
                  >
                    support@ubcupids.org
                  </a>
                </p>
                <p className="text-slate-700">
                  <strong>Response Time:</strong> We aim to respond within 24
                  hours
                </p>
              </div>
              <p className="text-sm text-slate-600 italic">
                We take your privacy seriously and are committed to addressing
                any concerns you may have.
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t pt-6 mt-8">
            <p className="text-sm text-slate-600 text-center">
              By using UBCupids, you acknowledge that you have read and
              understood this Privacy Notice and Terms of Service.
            </p>
            <p className="text-sm text-slate-500 text-center mt-2">
              Last Updated: January 16, 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
