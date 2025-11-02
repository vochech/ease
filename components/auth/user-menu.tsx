import { supabaseServer } from "@/lib/supabaseServer";
import { SignOutButton } from "@/components/auth/sign-out-button";

export async function UserMenu() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const initials = user.email
    ? user.email
        .split("@")[0]
        .split(".")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white">
          {initials}
        </div>
        <div className="hidden text-sm sm:block">
          <p className="font-medium text-gray-900">{user.email}</p>
        </div>
      </div>
      <SignOutButton />
    </div>
  );
}
