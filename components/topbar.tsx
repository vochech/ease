import { supabaseServer } from "@/lib/supabaseServer";

export default async function Topbar({ title = "Dashboard" }: { title?: string }) {
  let userName: string | undefined;
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userName = user?.email ?? undefined;
  } catch {
    // ignore if not configured
  }

  const initials = userName?.[0]?.toUpperCase() ?? "W"; // Welcome fallback

  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-3">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <div className="flex items-center gap-3">
          {userName && <span className="hidden text-sm text-gray-600 sm:inline">{userName}</span>}
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gray-200 text-sm font-medium text-gray-700">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
