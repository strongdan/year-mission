import { NextResponse } from "next/server";

const applicationIdentifier = "BWNJC57N56.com.strongdan.YearMission.v2";

export function GET() {
  return NextResponse.json(
    {
      webcredentials: {
        apps: [applicationIdentifier],
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
