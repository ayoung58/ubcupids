import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { ManualVerifyForm } from "./_components/ManualVerifyForm";

export const metadata: Metadata = {
  title: "Manual Verification | Admin | UBCupids",
  description: "Manually verify user emails",
};

export default async function ManualVerifyPage() {
  const session = await getCurrentUser();

  // Check authentication
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Check admin status
  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  if (!profile?.isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">
          Manual Email Verification
        </h1>
        <p className="text-slate-600 mt-2">
          Manually verify a user&apos;s email address when they can&apos;t
          receive verification emails.
        </p>
      </div>

      <ManualVerifyForm />
    </div>
  );
}
