import { Suspense } from "react";

import { Skeleton } from "@acme/ui/skeleton";
import { H1, P } from "@acme/ui/typography";

import { MapsGrid } from "~/components/maps/maps-grid";

function MapsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="bg-card flex flex-col gap-4 rounded-xl border p-6 shadow-2xs"
        >
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <main className="container py-16">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <H1>Amarix</H1>
          <P className="text-muted-foreground">
            Amarix is a map gallery for the Amarix game.
          </P>
        </div>

        <Suspense fallback={<MapsSkeleton />}>
          <MapsGrid />
        </Suspense>
      </div>
    </main>
  );
}
