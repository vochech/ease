import { redirect } from "next/navigation";

type OrgHomeProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgHome({ params }: OrgHomeProps) {
  const { orgSlug } = await params;
  // Redirect org root to projects page
  redirect(`/${orgSlug}/projects`);
}
