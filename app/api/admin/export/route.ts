import { NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/admin-auth";
import { loadWaitlistExportRows } from "@/lib/waitlist-admin-data";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  const admin = await getAdminUserFromRequest(request);
  if (!admin) {
    return new NextResponse(null, { status: 404 });
  }

  const rows = await loadWaitlistExportRows();
  if (!rows) {
    return new NextResponse(null, { status: 404 });
  }

  const lines = [
    "email,langue,source,date_inscription",
    ...rows.map((r) =>
      [r.email, r.langue, r.source, r.created_at].map((c) => csvEscape(c)).join(","),
    ),
  ];

  const body = lines.join("\n");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="paypulss-waitlist.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
