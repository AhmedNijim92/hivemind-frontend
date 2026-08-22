import { NextResponse } from "next/server";

/**
 * Runtime config endpoint.
 * Returns environment variables that the frontend needs at runtime.
 * This allows Helm/K8s env vars to reach the browser without rebuilding.
 */
export function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",
    livekitUrl: process.env.LIVEKIT_URL || "",
  });
}
