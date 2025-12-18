export default async function QuestionnaireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Main Content - No Header */}
      {children}
    </div>
  );
}
