import { DailyCheckinChat } from "@/components/daily-checkin-chat";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function Page({ params }: PageProps) {
  const { orgSlug } = await params;
  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Denní check‑in</h1>
      <p className="mb-6 text-sm text-gray-500">
        Rychlý check‑in ti pomůže přizpůsobit pracovní den. Vyplň prosím pár krátkých
        odpovědí.
      </p>
      <DailyCheckinChat orgSlug={orgSlug} />
    </main>
  );
}
