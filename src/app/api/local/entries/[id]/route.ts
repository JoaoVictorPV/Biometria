import { NextResponse } from "next/server";
import { BiometricEntryInputSchema } from "@/lib/db/biometrics.schema";
import { deleteLocalEntry, updateLocalEntry } from "@/lib/localdb/entries";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const input = BiometricEntryInputSchema.parse(body);
  const updated = await updateLocalEntry(id, input);
  return NextResponse.json({ entry: updated });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await deleteLocalEntry(id);
  return NextResponse.json({ ok: true });
}
