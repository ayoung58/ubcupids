import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-session";
import { MatchesDisplay } from "./MatchesDisplay";

export const metadata: Metadata = {
  title: "My Matches | UBCupids",
  description: "View your UBCupids matches",
};

export default async function MatchesPage() {
  const session = await getCurrentUser();

  if (!session?.user) {
    redirect("/login");
  }

  return <MatchesDisplay />;
}
