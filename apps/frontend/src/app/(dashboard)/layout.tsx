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
      <div className="relative flex w-full h-screen overflow-hidden bg-[#050507] text-foreground">
        {/* Ambient background glows for glassmorphism */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[45rem] h-[45rem] rounded-full bg-primary/10 blur-[130px] animate-glow-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[55rem] h-[55rem] rounded-full bg-indigo-500/10 blur-[160px] animate-glow-slower" />
          <div className="absolute top-[30%] right-[15%] w-[35rem] h-[35rem] rounded-full bg-emerald-500/5 blur-[120px]" />
        </div>

        <Sidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 bg-transparent">
          <Header />
          {children}
        </div>
      </div>
    </ClubProvider>
  );
}
