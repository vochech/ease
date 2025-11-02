import Link from "next/link";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string; error_description?: string };
}) {
  const params = searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Authentication Error
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Something went wrong during sign in
          </p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-red-200">
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
            <p className="font-medium">{params.error || "Unknown error"}</p>
            {params.error_description && (
              <p className="mt-1 text-xs">{params.error_description}</p>
            )}
          </div>

          <div className="mt-6">
            <Link
              href="/auth/login"
              className="block w-full rounded-lg bg-gray-900 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
