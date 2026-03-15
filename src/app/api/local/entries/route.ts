import { NextResponse } from "next/server";
import { BiometricEntryInputSchema } from "@/lib/db/biometrics.schema";
import { createLocalEntry, listLocalEntries } from "@/lib/localdb/entries";

export async function GET() {
  const entries = await listLocalEntries();
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const body = await request.json();
  const input = BiometricEntryInputSchema.parse(body);
  const created = await createLocalEntry(input);
  return NextResponse.json({ entry: created }, { status: 201 });
}
