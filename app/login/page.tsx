import Link from "next/link";

type SearchParams = Promise<{ redirect?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { redirect } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Ease
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Project management workspace
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-amber-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  Authentication Required
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>To access org-scoped routes, you need to:</p>
                  <ol className="mt-2 list-inside list-decimal space-y-1">
                    <li>
                      Run the seed script ({" "}
                      <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">
                        sql/seed_sample.sql
                      </code>{" "}
                      ) in Supabase SQL Editor
                    </li>
                    <li>
                      Add a test user in Supabase Auth (Authentication → Users →
                      Add user)
                    </li>
                    <li>Configure Supabase environment variables in .env.local</li>
                    <li>
                      Set up Supabase Auth UI or use direct sign-in (not
                      implemented yet)
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h4 className="text-sm font-medium text-gray-900">
                Quick Development Setup
              </h4>
              <p className="mt-2 text-sm text-gray-600">
                For now, you can either:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600">
                <li>Test the health endpoint: <Link href="/api/health" className="text-blue-600 hover:underline">/api/health</Link></li>
                <li>View the home page: <Link href="/" className="text-blue-600 hover:underline">/</Link></li>
                <li>
                  Add Supabase Auth UI (
                  <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
                    @supabase/auth-ui-react
                  </code>
                  )
                </li>
              </ul>
            </div>

            {redirect && (
              <div className="text-center text-sm text-gray-500">
                Attempted to access:{" "}
                <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
                  {redirect}
                </code>
              </div>
            )}
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
