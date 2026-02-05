"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Color palettes
const PINK_PURPLE_PALETTE = [
  "#ec4899", // pink-500
  "#a855f7", // purple-500
  "#f472b6", // pink-400
  "#c084fc", // purple-400
  "#fb7185", // rose-400
  "#d946ef", // fuchsia-500
  "#be185d", // pink-700
  "#7e22ce", // purple-700
];

const GRADIENT_PALETTE = [
  "#ec4899",
  "#e879f9",
  "#c084fc",
  "#a78bfa",
  "#818cf8",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
];

// Label formatters
const formatGenderIdentity = (value: string) => {
  const labels: Record<string, string> = {
    woman: "Woman",
    man: "Man",
    "non-binary": "Non-binary",
    genderqueer: "Genderqueer",
    prefer_not_to_answer: "Prefer not to say",
    self_describe: "Self-describe",
  };
  return labels[value] || value;
};

const formatGenderPreference = (value: string) => {
  const labels: Record<string, string> = {
    women: "Women",
    men: "Men",
    non_binary: "Non-binary",
    genderqueer: "Genderqueer",
    anyone: "Anyone",
  };
  return labels[value] || value;
};

const formatCulturalBackground = (value: string) => {
  const labels: Record<string, string> = {
    east_asian: "East Asian",
    south_asian: "South Asian",
    southeast_asian: "Southeast Asian",
    black: "Black",
    middle_eastern: "Middle Eastern",
    latin_american: "Latin American",
    white: "White",
    indigenous: "Indigenous",
    mixed: "Mixed",
    other: "Other",
    prefer_not_to_answer: "Prefer not to say",
  };
  return labels[value] || value;
};

const formatSexualOrientation = (value: string) => {
  const labels: Record<string, string> = {
    sexual_romantic: "Sexual & Romantic",
    asexual: "Asexual",
    aromantic: "Aromantic",
    asexual_aromantic: "Asexual & Aromantic",
    questioning: "Questioning",
    prefer_not_to_answer: "Prefer not to answer",
  };
  return labels[value] || value;
};

const formatReligion = (value: string) => {
  const labels: Record<string, string> = {
    atheist: "Atheist",
    agnostic: "Agnostic",
    spiritual_not_religious: "Spiritual",
    christian: "Christian",
    muslim: "Muslim",
    jewish: "Jewish",
    hindu: "Hindu",
    buddhist: "Buddhist",
    sikh: "Sikh",
    other: "Other",
    prefer_not_to_answer: "Prefer not to say",
  };
  return labels[value] || value;
};

const formatRelationshipStyle = (value: string) => {
  const labels: Record<string, string> = {
    monogamous: "Monogamous",
    open: "Open relationship",
    polyamorous: "Polyamorous",
    exploring: "Exploring",
    prefer_not_to_answer: "Prefer not to say",
  };
  return labels[value] || value;
};

const formatDatingHistory = (value: string) => {
  const labels: Record<string, string> = {
    never: "Never dated",
    few: "A few relationships",
    many: "Many relationships",
    currently_dating: "Currently dating",
    prefer_not_to_answer: "Prefer not to say",
  };
  return labels[value] || value;
};

const formatAlcoholConsumption = (value: string) => {
  const labels: Record<string, string> = {
    never: "Never",
    rarely: "Rarely",
    socially: "Socially",
    frequently: "Frequently",
    prefer_not_to_answer: "Prefer not to say",
  };
  return labels[value] || value;
};

const formatSubstanceUse = (value: string) => {
  const labels: Record<string, string> = {
    cannabis: "Cannabis",
    cigarettes: "Cigarettes",
    vaping: "Vaping",
    other_recreational: "Other recreational",
    none: "None",
  };
  return labels[value] || value;
};

// Age Distribution Chart
export function AgeDistributionChart({ ages }: { ages: number[] }) {
  // Create age buckets
  const ageBuckets: Record<string, number> = {};
  ages.forEach((age) => {
    const bucket = Math.floor(age / 2) * 2; // Group by 2-year intervals
    const bucketLabel = `${bucket}-${bucket + 1}`;
    ageBuckets[bucketLabel] = (ageBuckets[bucketLabel] || 0) + 1;
  });

  const data = Object.entries(ageBuckets)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([age, count]) => ({ age, count }));

  const avgAge =
    ages.length > 0
      ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1)
      : "N/A";

  return (
    <Card className="border-pink-200 bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Age Distribution
          <span className="text-sm font-normal text-slate-600">
            Avg: {avgAge} years
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="age"
              stroke="#64748b"
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="count" fill="#ec4899" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Gender Identity Chart
export function GenderIdentityChart({
  data,
}: {
  data: Record<string, number>;
}) {
  const chartData = Object.entries(data)
    .filter(([key]) => key !== "prefer_not_to_answer")
    .map(([name, value]) => ({
      name: formatGenderIdentity(name),
      value,
    }));

  return (
    <Card className="border-purple-200 bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg">Gender Identity</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${((percent || 0) * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PINK_PURPLE_PALETTE[index % PINK_PURPLE_PALETTE.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Gender Preference Chart
export function GenderPreferenceChart({
  data,
  totalUsers,
}: {
  data: Record<string, number>;
  totalUsers: number;
}) {
  const chartData = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({
      name: formatGenderPreference(name),
      value,
      percentage: ((value / totalUsers) * 100).toFixed(1),
    }));

  return (
    <Card className="border-pink-200 bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg">Gender Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              stroke="#64748b"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#64748b"
              style={{ fontSize: "12px" }}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="value" fill="#a855f7" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Campus Distribution Chart
export function CampusDistributionChart({
  data,
}: {
  data: Record<string, number>;
}) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <Card className="border-purple-200 bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg">Campus Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${((percent || 0) * 100).toFixed(1)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PINK_PURPLE_PALETTE[index % PINK_PURPLE_PALETTE.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Cultural Background Chart
export function CulturalBackgroundChart({
  data,
  totalUsers,
}: {
  data: Record<string, number>;
  totalUsers: number;
}) {
  const chartData = Object.entries(data)
    .filter(([key]) => key !== "prefer_not_to_answer")
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8) // Top 8
    .map(([name, value]) => ({
      name: formatCulturalBackground(name),
      value,
      percentage: ((value / totalUsers) * 100).toFixed(1),
    }));

  return (
    <Card className="border-pink-200 bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg">Cultural Background (Top 8)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              style={{ fontSize: "11px" }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="value" fill="#ec4899" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Sexual Orientation Chart
export function SexualOrientationChart({
  data,
}: {
  data: Record<string, number>;
}) {
  const chartData = Object.entries(data)
    .filter(([key]) => key !== "prefer_not_to_answer")
    .map(([name, value]) => ({
      name: formatSexualOrientation(name),
      value,
    }));

  return (
    <Card className="border-purple-200 bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg">Sexual Orientation</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${((percent || 0) * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={GRADIENT_PALETTE[index % GRADIENT_PALETTE.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Religion Chart
export function ReligionChart({
  data,
  totalUsers,
}: {
  data: Record<string, number>;
  totalUsers: number;
}) {
  const chartData = Object.entries(data)
    .filter(([key]) => key !== "prefer_not_to_answer")
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({
      name: formatReligion(name),
      value,
      percentage: ((value / totalUsers) * 100).toFixed(1),
    }));

  return (
    <Card className="border-pink-200 bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg">Religious & Spiritual Beliefs</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              style={{ fontSize: "11px" }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="value" fill="#a855f7" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Political Leaning Chart
export function PoliticalLeaningChart({
  data,
}: {
  data: Record<string, number>;
}) {
  const labels = [
    "1 (Very Progressive)",
    "2",
    "3 (Centrist)",
    "4",
    "5 (Very Conservative)",
  ];
  const chartData = ["1", "2", "3", "4", "5"].map((value, index) => ({
    name: labels[index],
    value: data[value] || 0,
  }));

  return (
    <Card className="border-purple-200 bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg">Political Leaning</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              style={{ fontSize: "10px" }}
              angle={-15}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="value" fill="#ec4899" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Introversion/Extroversion Chart
export function IntroversionExtroversionChart({
  data,
}: {
  data: Record<string, number>;
}) {
  const labels = [
    "1 (Strong Introvert)",
    "2",
    "3 (Ambivert)",
    "4",
    "5 (Strong Extrovert)",
  ];
  const chartData = ["1", "2", "3", "4", "5"].map((value, index) => ({
    name: labels[index],
    value: data[value] || 0,
  }));

  return (
    <Card className="border-pink-200 bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg">Introversion / Extroversion</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              style={{ fontSize: "10px" }}
              angle={-15}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="value" fill="#a855f7" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Relationship Style Chart
export function RelationshipStyleChart({
  data,
}: {
  data: Record<string, number>;
}) {
  const chartData = Object.entries(data)
    .filter(([key]) => key !== "prefer_not_to_answer")
    .map(([name, value]) => ({
      name: formatRelationshipStyle(name),
      value,
    }));

  return (
    <Card className="border-purple-200 bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg">Relationship Style</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${((percent || 0) * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PINK_PURPLE_PALETTE[index % PINK_PURPLE_PALETTE.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Dating History Chart
export function DatingHistoryChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data)
    .filter(([key]) => key !== "prefer_not_to_answer")
    .map(([name, value]) => ({
      name: formatDatingHistory(name),
      value,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <Card className="border-pink-200 bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg">Dating History</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              stroke="#64748b"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#64748b"
              style={{ fontSize: "12px" }}
              width={150}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="value" fill="#ec4899" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Alcohol Consumption Chart
export function AlcoholConsumptionChart({
  data,
}: {
  data: Record<string, number>;
}) {
  const order = ["never", "rarely", "socially", "frequently"];
  const chartData = order
    .filter((key) => data[key])
    .map((name) => ({
      name: formatAlcoholConsumption(name),
      value: data[name],
    }));

  return (
    <Card className="border-purple-200 bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg">Alcohol Consumption</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="value" fill="#a855f7" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Substance Use Chart
export function SubstanceUseChart({
  data,
  totalUsers,
}: {
  data: Record<string, number>;
  totalUsers: number;
}) {
  const chartData = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({
      name: formatSubstanceUse(name),
      value,
      percentage: ((value / totalUsers) * 100).toFixed(1),
    }));

  return (
    <Card className="border-pink-200 bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg">Substance Use</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              stroke="#64748b"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#64748b"
              style={{ fontSize: "12px" }}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="value" fill="#ec4899" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Engagement Metrics Chart
export function EngagementMetricsChart({
  totalUsers,
  withProfilePicture,
  withBio,
  withInterests,
  dualRole,
}: {
  totalUsers: number;
  withProfilePicture: number;
  withBio: number;
  withInterests: number;
  dualRole: number;
}) {
  const data = [
    {
      name: "Profile Picture",
      count: withProfilePicture,
      percentage: ((withProfilePicture / totalUsers) * 100).toFixed(1),
    },
    {
      name: "Bio Written",
      count: withBio,
      percentage: ((withBio / totalUsers) * 100).toFixed(1),
    },
    {
      name: "Interests Added",
      count: withInterests,
      percentage: ((withInterests / totalUsers) * 100).toFixed(1),
    },
    {
      name: "Dual Role (Match & Cupid)",
      count: dualRole,
      percentage: ((dualRole / totalUsers) * 100).toFixed(1),
    },
  ];

  return (
    <Card className="border-purple-200 bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg">
          Profile Completion & Participation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              stroke="#64748b"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#64748b"
              style={{ fontSize: "12px" }}
              width={180}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="count" radius={[0, 8, 8, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={GRADIENT_PALETTE[index % GRADIENT_PALETTE.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-slate-600 text-center">
          {totalUsers} total users tracked
        </div>
      </CardContent>
    </Card>
  );
}
