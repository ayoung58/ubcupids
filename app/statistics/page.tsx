import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Home } from "lucide-react";
import {
  AgeDistributionChart,
  GenderIdentityChart,
  GenderPreferenceChart,
  CampusDistributionChart,
  CulturalBackgroundChart,
  SexualOrientationChart,
  ReligionChart,
  PoliticalLeaningChart,
  IntroversionExtroversionChart,
  RelationshipStyleChart,
  DatingHistoryChart,
  AlcoholConsumptionChart,
  SubstanceUseChart,
  EngagementMetricsChart,
} from "./_components/StatisticsCharts";

interface QuestionnaireResponses {
  [key: string]: {
    answer?: string | number | string[];
    preference?: string | number | string[] | null;
    importance?: string | null;
    dealbreaker?: boolean;
  };
}

export const dynamic = "force-dynamic";

/**
 * Public Statistics Page
 *
 * Shows demographic and questionnaire statistics for matched users
 * who have submitted their questionnaires (excluding test users).
 */

async function getStatisticsData() {
  // Get all matched users who have submitted questionnaire v2 (excluding test users)
  const matchedUsers = await prisma.user.findMany({
    where: {
      isTestUser: false,
      isBeingMatched: true,
      questionnaireResponseV2: {
        isSubmitted: true,
      },
      OR: [{ matchesGiven: { some: {} } }, { matchesReceived: { some: {} } }],
    },
    include: {
      questionnaireResponseV2: true,
    },
  });

  // Extract statistics
  const stats = {
    totalUsers: matchedUsers.length,
    ages: [] as number[],
    genderIdentity: {} as Record<string, number>,
    genderPreference: {} as Record<string, number>,
    campus: {} as Record<string, number>,
    culturalBackground: {} as Record<string, number>,
    sexualOrientation: {} as Record<string, number>,
    religion: {} as Record<string, number>,
    politicalLeaning: {} as Record<string, number>,
    introversionExtroversion: {} as Record<string, number>,
    relationshipStyle: {} as Record<string, number>,
    datingHistory: {} as Record<string, number>,
    alcoholConsumption: {} as Record<string, number>,
    substanceUse: {} as Record<string, number>,
    // Engagement metrics
    withProfilePicture: 0,
    withBio: 0,
    withInterests: 0,
    dualRole: 0, // Both match user AND cupid
  };

  matchedUsers.forEach((user) => {
    // Age
    if (user.age) {
      stats.ages.push(user.age);
    }

    // Campus
    const campus = user.campus || "Vancouver";
    stats.campus[campus] = (stats.campus[campus] || 0) + 1;

    // Profile completeness
    if (user.profilePicture) stats.withProfilePicture++;
    if (user.bio) stats.withBio++;
    if (user.interests) stats.withInterests++;

    // Dual role (both match user and cupid)
    if (user.isCupid && user.isBeingMatched) stats.dualRole++;

    // Parse questionnaire responses
    const responses = user.questionnaireResponseV2
      ?.responses as QuestionnaireResponses;
    if (!responses) return;

    // Q1: Gender Identity
    const q1 = responses.q1?.answer;
    if (q1 && typeof q1 === "string") {
      stats.genderIdentity[q1] = (stats.genderIdentity[q1] || 0) + 1;
    }

    // Q2: Gender Preference (multi-select)
    const q2 = responses.q2?.answer;
    if (Array.isArray(q2)) {
      q2.forEach((pref: string) => {
        stats.genderPreference[pref] = (stats.genderPreference[pref] || 0) + 1;
      });
    }

    // Q3: Sexual Orientation
    const q3 = responses.q3?.answer;
    if (q3 && typeof q3 === "string") {
      stats.sexualOrientation[q3] = (stats.sexualOrientation[q3] || 0) + 1;
    }

    // Q5: Cultural Background (multi-select)
    const q5 = responses.q5?.answer;
    if (Array.isArray(q5)) {
      q5.forEach((bg: string) => {
        stats.culturalBackground[bg] = (stats.culturalBackground[bg] || 0) + 1;
      });
    }

    // Q6: Religion (multi-select)
    const q6 = responses.q6?.answer;
    if (Array.isArray(q6)) {
      q6.forEach((rel: string) => {
        stats.religion[rel] = (stats.religion[rel] || 0) + 1;
      });
    }

    // Q7: Political Leaning (likert 1-5)
    const q7 = responses.q7?.answer;
    if (typeof q7 === "number") {
      stats.politicalLeaning[q7.toString()] =
        (stats.politicalLeaning[q7.toString()] || 0) + 1;
    }

    // Q8: Alcohol Consumption
    const q8 = responses.q8?.answer;
    if (q8 && typeof q8 === "string") {
      stats.alcoholConsumption[q8] = (stats.alcoholConsumption[q8] || 0) + 1;
    }

    // Q9a: Substance Use (multi-select)
    const q9a = responses.q9a?.answer;
    if (Array.isArray(q9a)) {
      q9a.forEach((sub: string) => {
        stats.substanceUse[sub] = (stats.substanceUse[sub] || 0) + 1;
      });
    }

    // Q11: Relationship Style
    const q11 = responses.q11?.answer;
    if (q11 && typeof q11 === "string") {
      stats.relationshipStyle[q11] = (stats.relationshipStyle[q11] || 0) + 1;
    }

    // Q14: Dating History
    const q14 = responses.q14?.answer;
    if (q14 && typeof q14 === "string") {
      stats.datingHistory[q14] = (stats.datingHistory[q14] || 0) + 1;
    }

    // Q22: Introversion/Extroversion (likert 1-5)
    const q22 = responses.q22?.answer;
    if (typeof q22 === "number") {
      stats.introversionExtroversion[q22.toString()] =
        (stats.introversionExtroversion[q22.toString()] || 0) + 1;
    }
  });

  return stats;
}

export default async function StatisticsPage() {
  const stats = await getStatisticsData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              UBCupids Statistics
            </h1>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-pink-600 hover:bg-pink-50 rounded-md transition-colors"
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Home</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Overview Card */}
        <Card className="border-2 border-pink-200 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl text-center bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Community Insights
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Statistics from {stats.totalUsers} matched UBC students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-slate-600">
              Explore the demographics and preferences of our UBCupids
              community. All data is anonymized and aggregated from users who
              have completed their questionnaires and been matched.
            </p>
          </CardContent>
        </Card>

        {/* Demographics Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-3xl">👥</span>
            Demographics
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AgeDistributionChart ages={stats.ages} />
            <GenderIdentityChart data={stats.genderIdentity} />
            <GenderPreferenceChart
              data={stats.genderPreference}
              totalUsers={stats.totalUsers}
            />
            <CampusDistributionChart data={stats.campus} />
            <CulturalBackgroundChart
              data={stats.culturalBackground}
              totalUsers={stats.totalUsers}
            />
            <SexualOrientationChart data={stats.sexualOrientation} />
          </div>
        </div>

        {/* Beliefs & Values Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-3xl">💭</span>
            Beliefs & Values
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReligionChart
              data={stats.religion}
              totalUsers={stats.totalUsers}
            />
            <PoliticalLeaningChart data={stats.politicalLeaning} />
          </div>
        </div>

        {/* Lifestyle Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-3xl">🌟</span>
            Lifestyle & Personality
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IntroversionExtroversionChart
              data={stats.introversionExtroversion}
            />
            <RelationshipStyleChart data={stats.relationshipStyle} />
            <DatingHistoryChart data={stats.datingHistory} />
            <AlcoholConsumptionChart data={stats.alcoholConsumption} />
            <SubstanceUseChart
              data={stats.substanceUse}
              totalUsers={stats.totalUsers}
            />
          </div>
        </div>

        {/* Engagement Metrics Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-3xl">📊</span>
            Community Engagement
          </h2>

          <EngagementMetricsChart
            totalUsers={stats.totalUsers}
            withProfilePicture={stats.withProfilePicture}
            withBio={stats.withBio}
            withInterests={stats.withInterests}
            dualRole={stats.dualRole}
          />
        </div>

        {/* Footer Note */}
        <Card className="bg-slate-100 border-slate-300">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 text-center">
              📊 Statistics are updated in real-time and include only users who
              have submitted their questionnaires and have been matched. All
              data is anonymized to protect privacy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
