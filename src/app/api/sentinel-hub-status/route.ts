import { NextResponse } from 'next/server';

export function GET() {
  const configured = !!(
    process.env.SENTINEL_HUB_CLIENT_ID &&
    process.env.SENTINEL_HUB_CLIENT_SECRET
  );
  return NextResponse.json({ configured });
}
