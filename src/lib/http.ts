import { NextResponse } from "next/server";
import { NotFoundError } from "@/lib/store";
import { SchemaValidationError } from "@/lib/validate";
import { PackageError } from "@/lib/zip-package";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonFromError(error: unknown): NextResponse {
  if (error instanceof SchemaValidationError) {
    return NextResponse.json(
      { error: error.message, issues: error.issues },
      { status: 422 },
    );
  }
  if (error instanceof PackageError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status: 500 });
}
