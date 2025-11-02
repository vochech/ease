"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProfileEditFormProps = {
  orgSlug: string;
  initialProfile: any;
  userEmail: string;
  currentRole: string;
};

const ROLE_LEVELS = ["intern", "junior", "mid", "senior", "lead", "principal"];
const EMPLOYMENT_STATUSES = [
  "active",
  "onboarding",
  "notice_period",
  "parental_leave",
  "inactive",
];
const WORK_STYLES = ["independent", "collaborative", "mixed"];

export function ProfileEditForm({
  orgSlug,
  initialProfile,
  userEmail,
  currentRole,
}: ProfileEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Form state
  const [fullName, setFullName] = useState(initialProfile?.full_name || "");
  const [displayName, setDisplayName] = useState(
    initialProfile?.display_name || "",
  );
  const [bio, setBio] = useState(initialProfile?.bio || "");
  const [phone, setPhone] = useState(initialProfile?.phone || "");
  const [roleLevel, setRoleLevel] = useState(
    initialProfile?.role_level || "mid",
  );
  const [positionTitle, setPositionTitle] = useState(
    initialProfile?.position_title || "",
  );
  const [specialization, setSpecialization] = useState(
    initialProfile?.specialization || "",
  );
  const [yearsExperience, setYearsExperience] = useState(
    initialProfile?.years_of_experience || 0,
  );
  const [skills, setSkills] = useState<string[]>(initialProfile?.skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [shiftPattern, setShiftPattern] = useState(
    initialProfile?.shift_pattern || "",
  );
  const [workingHours, setWorkingHours] = useState(
    initialProfile?.working_hours_per_week || 40,
  );
  const [preferredWorkStyle, setPreferredWorkStyle] = useState(
    initialProfile?.preferred_work_style || "mixed",
  );
  const [capacity, setCapacity] = useState(
    initialProfile?.current_capacity_percentage || 100,
  );
  const [isAvailable, setIsAvailable] = useState(
    initialProfile?.is_available_for_tasks ?? true,
  );
  const [employmentStatus, setEmploymentStatus] = useState(
    initialProfile?.employment_status || "active",
  );

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/${orgSlug}/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName || null,
          display_name: displayName || null,
          bio: bio || null,
          phone: phone || null,
          role_level: roleLevel,
          position_title: positionTitle || null,
          specialization: specialization || null,
          years_of_experience: yearsExperience,
          skills,
          shift_pattern: shiftPattern || null,
          working_hours_per_week: workingHours,
          preferred_work_style: preferredWorkStyle,
          current_capacity_percentage: capacity,
          is_available_for_tasks: isAvailable,
          employment_status: employmentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      setSuccessMessage("✅ Profil úspěšně uložen!");
      router.refresh();

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Profile update error:", error);
      alert("Chyba při ukládání profilu. Zkus to znovu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Success message */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm font-medium text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Personal Information */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Osobní údaje
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Celé jméno
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Jan Novák"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Přezdívka
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Honza"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={userEmail}
              disabled
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">Email nelze měnit</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefon
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="+420 123 456 789"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role v organizaci
            </label>
            <input
              type="text"
              value={currentRole}
              disabled
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm capitalize text-gray-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Něco o sobě..."
            />
          </div>
        </div>
      </section>

      {/* Role & Experience */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Role a zkušenosti
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Úroveň seniority
            </label>
            <select
              value={roleLevel}
              onChange={(e) => setRoleLevel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              {ROLE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Frontend Developer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specializace
            </label>
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="React, TypeScript"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Roky praxe
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={yearsExperience}
              onChange={(e) =>
                setYearsExperience(parseInt(e.target.value) || 0)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stav zaměstnání
            </label>
            <select
              value={employmentStatus}
              onChange={(e) => setEmploymentStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              {EMPLOYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, " ").charAt(0).toUpperCase() +
                    status.replace(/_/g, " ").slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Skills */}
        <div className="mt-4">
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
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Přidat dovednost..."
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
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
            {skills.length === 0 && (
              <p className="text-sm text-gray-500">Žádné dovednosti</p>
            )}
          </div>
        </div>
      </section>

      {/* Work Preferences */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Pracovní preference
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Směna
            </label>
            <input
              type="text"
              value={shiftPattern}
              onChange={(e) => setShiftPattern(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="9:00 - 17:00"
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
              onChange={(e) => setWorkingHours(parseInt(e.target.value) || 40)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Styl práce
            </label>
            <select
              value={preferredWorkStyle}
              onChange={(e) => setPreferredWorkStyle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              {WORK_STYLES.map((style) => (
                <option key={style} value={style}>
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Capacity & Availability */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Kapacita a dostupnost
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aktuální kapacita:{" "}
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
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="available"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <label
              htmlFor="available"
              className="text-sm font-medium text-gray-700"
            >
              Dostupný/á pro přiřazování tasků
            </label>
          </div>
        </div>
      </section>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Zrušit
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Ukládám..." : "Uložit profil"}
        </button>
      </div>
    </form>
  );
}
