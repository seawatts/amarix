"use server";

import { desc } from "drizzle-orm";

import { db } from "@acme/db/client";
import { Maps } from "@acme/db/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Icons } from "@acme/ui/icons";
import { H2 } from "@acme/ui/typography";

async function getMaps() {
  return db.query.Maps.findMany({
    limit: 50,
    orderBy: [desc(Maps.updatedAt)],
  });
}

export async function MapsGrid() {
  const maps = await getMaps();

  if (maps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <Icons.GalleryVerticalEnd size="xl" variant="muted" />
        <H2>No maps found</H2>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {maps.map((map) => (
        <Card key={map.id} className="flex flex-col">
          <CardHeader>
            <CardTitle>{map.name}</CardTitle>
            <CardDescription>
              {map.description ?? "No description provided"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="flex flex-wrap gap-2">
              {map.tags?.map((tag) => (
                <span
                  key={tag}
                  className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
          <CardFooter className="text-muted-foreground text-sm">
            Last updated {map.updatedAt?.toLocaleDateString() ?? "Never"}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
