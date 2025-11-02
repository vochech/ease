"use client";

import { useEffect, useState } from "react";

type TeamMember = {
  user_id: string;
  email: string;
  name: string;
  stress_score: number | null;
  mood_score: number | null;
  mood_emoji: string | null;
  burnout_risk: number | null;
  ai_performance_score: number | null;
  on_vacation: boolean;
  on_sick_leave: boolean;
  weekly_capacity_hours: number | null;
};

type PeopleAnalyticsDashboardProps = {
  orgSlug: string;
};

export function PeopleAnalyticsDashboard({
  orgSlug,
}: PeopleAnalyticsDashboardProps) {
  const [teamHealth, setTeamHealth] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeamHealth = async () => {
      try {
        const response = await fetch(`/api/${orgSlug}/analytics/team-health`);
        if (response.ok) {
          const data = await response.json();
          setTeamHealth(data.team_health || []);
        }
      } catch (error) {
        console.error("Failed to fetch team health:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamHealth();
  }, [orgSlug]);

  const getStressColor = (score: number | null) => {
    if (score === null) return "text-gray-400";
    if (score <= 3) return "text-green-600";
    if (score <= 5) return "text-blue-600";
    if (score <= 7) return "text-yellow-600";
    if (score <= 8) return "text-orange-600";
    return "text-red-600";
  };

  const getBurnoutColor = (risk: number | null) => {
    if (risk === null) return "bg-gray-200";
    if (risk <= 0.3) return "bg-green-500";
    if (risk <= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const avgStress =
    teamHealth
      .filter((m) => m.stress_score !== null)
      .reduce((sum, m) => sum + (m.stress_score || 0), 0) /
    (teamHealth.filter((m) => m.stress_score !== null).length || 1);

  const avgMood =
    teamHealth
      .filter((m) => m.mood_score !== null)
      .reduce((sum, m) => sum + (m.mood_score || 0), 0) /
    (teamHealth.filter((m) => m.mood_score !== null).length || 1);

  const highRiskCount = teamHealth.filter(
    (m) => m.burnout_risk !== null && m.burnout_risk > 0.7,
  ).length;

  const onVacationCount = teamHealth.filter((m) => m.on_vacation).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading team analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-600">Team Size</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {teamHealth.length}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {onVacationCount} on vacation
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-600">
            Avg Stress Level
          </div>
          <div
            className={`mt-2 text-3xl font-bold ${getStressColor(avgStress)}`}
          >
            {avgStress.toFixed(1)}/10
          </div>
          <div className="mt-1 text-xs text-gray-500">Lower is better</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-600">Avg Mood</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {avgMood.toFixed(1)}/10
          </div>
          <div className="mt-1 text-xs text-gray-500">Higher is better</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-600">
            High Burnout Risk
          </div>
          <div className="mt-2 text-3xl font-bold text-red-600">
            {highRiskCount}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {highRiskCount > 0 ? "Action needed!" : "All good"}
          </div>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Team Health Overview
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Member</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Mood</th>
                <th className="px-4 py-3 text-center">Stress</th>
                <th className="px-4 py-3 text-center">Burnout Risk</th>
                <th className="px-4 py-3 text-center">Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teamHealth.map((member) => (
                <tr key={member.user_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {member.name}
                    </div>
                    <div className="text-xs text-gray-500">{member.email}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {member.on_vacation ? (
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        Vacation
                      </span>
                    ) : member.on_sick_leave ? (
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                        Sick Leave
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {member.mood_score !== null ? (
                      <div className="flex flex-col items-center gap-1">
                        {member.mood_emoji && (
                          <span className="text-2xl">{member.mood_emoji}</span>
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          {member.mood_score}/10
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {member.stress_score !== null ? (
                      <span
                        className={`text-lg font-bold ${getStressColor(
                          member.stress_score,
                        )}`}
                      >
                        {member.stress_score}/10
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {member.burnout_risk !== null ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full ${getBurnoutColor(
                              member.burnout_risk,
                            )}`}
                            style={{ width: `${member.burnout_risk * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {(member.burnout_risk * 100).toFixed(0)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {member.weekly_capacity_hours !== null ? (
                      <span className="text-sm font-medium text-gray-700">
                        {member.weekly_capacity_hours}h/week
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {teamHealth.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No team data available. Members need to complete check-ins.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert for High Risk Members */}
      {highRiskCount > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-6 w-6 flex-shrink-0 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-red-900">
                {highRiskCount} team member{highRiskCount > 1 ? "s" : ""} at
                high burnout risk
              </h3>
              <p className="mt-1 text-sm text-red-700">
                Consider redistributing workload, offering support, or
                scheduling 1:1 check-ins.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
