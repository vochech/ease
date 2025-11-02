import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Page() {
  // Always start at explicit login to confirm the session
  redirect("/auth/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Welcome to Ease
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Project management made simple
          </p>
        </div>

        <div className="space-y-4" />
      </div>
    </main>
  );
}
