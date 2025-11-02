"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TeamMember = {
  user_id: string;
  email: string;
  name: string;
  role: string;
  joined_at: string;
  onboarding_completed: boolean;
  onboarding_prefilled: boolean;
  profile: any;
};

type TeamMembersOnboardingListProps = {
  orgSlug: string;
  members: TeamMember[];
  currentUserId: string;
};

export function TeamMembersOnboardingList({
  orgSlug,
  members,
  currentUserId,
}: TeamMembersOnboardingListProps) {
  const router = useRouter();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Filter to show only members who need onboarding
  const pendingMembers = members.filter(
    (m) => !m.onboarding_completed && m.user_id !== currentUserId,
  );
  const completedMembers = members.filter((m) => m.onboarding_completed);

  return (
    <div className="space-y-6">
      {/* Pending onboarding */}
      {pendingMembers.length > 0 && (
        <section className="rounded-xl border border-orange-200 bg-orange-50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-orange-900">
            ⏳ Čekají na onboarding ({pendingMembers.length})
          </h2>
          <div className="space-y-3">
            {pendingMembers.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between rounded-lg border border-orange-200 bg-white p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Přidán {new Date(member.joined_at).toLocaleDateString("cs")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {member.onboarding_prefilled ? (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                      Předvyplněno ✓
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      Nepředvyplněno
                    </span>
                  )}
                  <button
                    onClick={() => setSelectedMember(member)}
                    className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
                  >
                    {member.onboarding_prefilled ? "Upravit" : "Předvyplnit"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Completed onboarding */}
      {completedMembers.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            ✅ Onboarding dokončen ({completedMembers.length})
          </h2>
          <div className="space-y-2">
            {completedMembers.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <span className="text-sm text-green-600">Hotovo</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Prefill modal */}
      {selectedMember && (
        <PrefillModal
          orgSlug={orgSlug}
          member={selectedMember}
          onClose={() => {
            setSelectedMember(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

type PrefillModalProps = {
  orgSlug: string;
  member: TeamMember;
  onClose: () => void;
};

function PrefillModal({ orgSlug, member, onClose }: PrefillModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(
    member.profile?.full_name || member.name || "",
  );
  const [roleLevel, setRoleLevel] = useState(
    member.profile?.role_level || "mid",
  );
  const [positionTitle, setPositionTitle] = useState(
    member.profile?.position_title || "",
  );
  const [skills, setSkills] = useState<string[]>(member.profile?.skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [yearsExperience, setYearsExperience] = useState(
    member.profile?.years_of_experience || 0,
  );
  const [workingHours, setWorkingHours] = useState(
    member.profile?.working_hours_per_week || 40,
  );
  const [capacity, setCapacity] = useState(
    member.profile?.current_capacity_percentage || 100,
  );

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/${orgSlug}/settings/prefill-onboarding`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_user_id: member.user_id,
            full_name: fullName,
            role_level: roleLevel,
            position_title: positionTitle,
            skills,
            years_of_experience: yearsExperience,
            working_hours_per_week: workingHours,
            current_capacity_percentage: capacity,
            is_available_for_tasks: true,
            employment_status: "active",
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to prefill profile");
      }

      alert(`✅ Profil pro ${fullName} byl předvyplněn!`);
      onClose();
    } catch (error) {
      console.error("Prefill error:", error);
      alert("Chyba při ukládání. Zkus to znovu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Předvyplnit profil: {member.name}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <p className="mb-6 text-sm text-gray-600">
          Vyplň co víš o novém členovi týmu. Usnadníš mu start a AI onboarding
          bude jen kontrola a doplnění nálady.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Celé jméno
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seniorita
              </label>
              <select
                value={roleLevel}
                onChange={(e) => setRoleLevel(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="intern">Intern</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="principal">Principal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pozice
              </label>
              <input
                type="text"
                value={positionTitle}
                onChange={(e) => setPositionTitle(e.target.value)}
                placeholder="Frontend Developer"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roky praxe
              </label>
              <input
                type="number"
                min="0"
                value={yearsExperience}
                onChange={(e) =>
                  setYearsExperience(parseInt(e.target.value) || 0)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hodin týdně
              </label>
              <input
                type="number"
                min="0"
                max="80"
                value={workingHours}
                onChange={(e) =>
                  setWorkingHours(parseInt(e.target.value) || 40)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dovednosti
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddSkill())
                }
                placeholder="React, TypeScript, Figma..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Přidat
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => setSkills(skills.filter((s) => s !== skill))}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kapacita:{" "}
              <span className="font-bold text-blue-600">{capacity}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
            >
              {isSubmitting ? "Ukládám..." : "Předvyplnit profil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
