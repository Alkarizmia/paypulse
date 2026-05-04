export function clientIpFromRequest(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unset";
  const xr = request.headers.get("x-real-ip");
  if (xr?.trim()) return xr.trim();
  return "unset";
}
