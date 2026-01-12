import { Metadata } from "next";
import { UserGuideContent } from "./UserGuideContent";

export const metadata: Metadata = {
  title: "User Guide | UBCupids",
  description: "Complete guide to using UBCupids",
};

export const dynamic = "force-dynamic";

export default function UserGuidePage() {
  return <UserGuideContent />;
}
