import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

const API_KEY = process.env.LIVEKIT_API_KEY || "APIhivemind123";
const API_SECRET = process.env.LIVEKIT_API_SECRET || "secrethivemind456789012345678901234567";

/**
 * Generate a LiveKit access token for a participant.
 * POST /api/livekit-token
 * Body: { roomName, identity, name, isHost }
 */
export async function POST(req: NextRequest) {
  try {
    const { roomName, identity, name, isHost } = await req.json();

    if (!roomName || !identity) {
      return NextResponse.json({ error: "roomName and identity are required" }, { status: 400 });
    }

    const token = new AccessToken(API_KEY, API_SECRET, {
      identity,
      name: name || identity,
      ttl: "24h",
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: isHost === true,
      roomCreate: isHost === true,
    });

    const jwt = await token.toJwt();

    return NextResponse.json({ token: jwt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Token generation failed" }, { status: 500 });
  }
}
