import Link from "next/link";

export default function SettingsPage() {
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Nastavení</h1>
      <p className="text-sm text-gray-600">
        Vyber typ nastavení, které chceš upravit.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="./settings/org"
          className="rounded-xl border border-gray-200 p-4 transition hover:shadow"
        >
          <h2 className="text-lg font-medium">Organizace</h2>
          <p className="mt-1 text-sm text-gray-600">
            Pracovní dny, časové pásmo, AI asistent, meeting policy
          </p>
        </Link>

        <Link
          href="./settings/personal"
          className="rounded-xl border border-gray-200 p-4 transition hover:shadow"
        >
          <h2 className="text-lg font-medium">Osobní</h2>
          <p className="mt-1 text-sm text-gray-600">
            Téma, jazyk, focus-time, připomínky
          </p>
        </Link>

        <Link
          href="./settings/profile"
          className="rounded-xl border border-gray-200 p-4 transition hover:shadow"
        >
          <h2 className="text-lg font-medium">Profil</h2>
          <p className="mt-1 text-sm text-gray-600">Údaje o profilu a dovednosti</p>
        </Link>
      </div>
    </main>
  );
}
