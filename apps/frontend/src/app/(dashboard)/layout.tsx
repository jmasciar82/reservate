import { cookies } from "next/headers";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ClubProvider } from "@/providers/ClubProvider";
import { apiFetch } from "@/lib/api";
import type { Club } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let clubs: Club[] = [];
  try {
    const res = await apiFetch("/clubs", { cache: "no-store" });
    if (res.ok) {
      clubs = await res.json();
    }
  } catch (error) {
    console.error("Error fetching clubs for layout", error);
  }

  const cookieStore = await cookies();
  const activeClubId = cookieStore.get("reservate_active_club")?.value || null;

  return (
    <ClubProvider initialClubs={clubs} initialActiveClubId={activeClubId}>
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />
        {children}
      </div>
    </ClubProvider>
  );
}
