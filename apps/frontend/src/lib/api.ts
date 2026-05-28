type QueryValue = string | number | boolean | null | undefined;

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function apiUrl(
  path: string,
  params: Record<string, QueryValue> = {},
) {
  const url = new URL(path, API_BASE_URL);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  params: Record<string, QueryValue> = {}
) {
  const url = apiUrl(path, params);
  
  // Try to get token from cookies-next which handles both client and server safely if configured right, 
  // but next/headers is better for Server Components. 
  // A safe approach for Next.js 13+ App router:
  let token: string | undefined;
  
  if (typeof window === "undefined") {
    // Server side
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    token = cookieStore.get("token")?.value;
  } else {
    // Client side
    const Cookies = (await import("js-cookie")).default;
    token = Cookies.get("token");
  }

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

export function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function getClientUserRole(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const Cookies = require("js-cookie");
    const token = Cookies.get("token");
    if (!token) return null;
    const decoded = decodeJwt(token);
    return decoded?.role ?? null;
  } catch (err) {
    return null;
  }
}
