import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function QuestionnaireLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar Skeleton */}
      <div className="sticky top-0 bg-white z-10 py-3 md:py-4 border-b shadow-sm">
        <div className="container max-w-4xl px-4">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-20 md:w-24" />
            <Skeleton className="h-4 w-32 md:w-48" />
          </div>
          <div className="flex items-center space-x-2 md:space-x-3">
            <Skeleton className="h-2 md:h-2.5 flex-1" />
            <Skeleton className="h-4 w-10 md:w-12" />
          </div>
        </div>
      </div>

      <div className="container max-w-4xl py-6 md:py-8 px-4">
        {/* Header Skeleton */}
        <div className="mb-6 md:mb-8">
          <Skeleton className="h-8 md:h-10 w-full max-w-md mb-2" />
          <Skeleton className="h-4 md:h-5 w-full max-w-xl" />
        </div>

        {/* Section Skeletons */}
        {[1, 2, 3].map((i) => (
          <Card key={i} className="mb-6 shadow-sm">
            <CardHeader className="bg-slate-50 px-4 md:px-6">
              <Skeleton className="h-6 md:h-8 w-48 md:w-64" />
              <Skeleton className="h-3 md:h-4 w-full max-w-lg mt-2" />
            </CardHeader>
            <CardContent className="space-y-6 md:space-y-8 pt-4 md:pt-6 px-4 md:px-6">
              {[1, 2, 3].map((j) => (
                <div key={j} className="pb-6 border-b last:border-b-0">
                  <Skeleton className="h-5 w-3/4 mb-3" />
                  <div className="space-y-2">
                    <Skeleton className="h-10 md:h-12 w-full" />
                    <Skeleton className="h-10 md:h-12 w-full" />
                    <Skeleton className="h-10 md:h-12 w-full" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
