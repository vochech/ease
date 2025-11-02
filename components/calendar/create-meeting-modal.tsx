"use client";

import { useState } from "react";
import type { OrgMember } from "./types";

type CreateMeetingModalProps = {
  orgSlug: string;
  orgMembers: OrgMember[];
  projects: { id: string; name: string }[];
  onCloseAction: () => void;
};

export function CreateMeetingModal({
  orgSlug,
  orgMembers,
  projects,
  onCloseAction,
}: CreateMeetingModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [useExternalLink, setUseExternalLink] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const startDateTime = `${startDate}T${startTime}:00`;
      const endDateTime = `${startDate}T${endTime}:00`;

      const res = await fetch(`/api/${orgSlug}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          project_id: projectId,
          start_time: startDateTime,
          end_time: endTime ? `${startDate}T${endTime}:00` : null,
          location,
          meeting_link: meetingLink,
          participant_ids: selectedParticipants,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create meeting");
      }

      onCloseAction();
      window.location.reload();
    } catch (error) {
      console.error("Failed to create meeting:", error);
      alert("Failed to create meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white shadow-xl">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Create Meeting
            </h2>
          </div>

          <div className="max-h-[calc(100vh-200px)] space-y-4 overflow-y-auto p-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="Team standup"
              />
            </div>

            {/* Project */}
            <div>
              <label
                htmlFor="project"
                className="block text-sm font-medium text-gray-700"
              >
                Project *
              </label>
              <select
                id="project"
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                {projects.length === 0 && (
                  <option value="">No projects available</option>
                )}
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="Discuss project progress..."
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700"
                >
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div>
                <label
                  htmlFor="start-time"
                  className="block text-sm font-medium text-gray-700"
                >
                  Start Time *
                </label>
                <input
                  type="time"
                  id="start-time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div>
                <label
                  htmlFor="end-time"
                  className="block text-sm font-medium text-gray-700"
                >
                  End Time
                </label>
                <input
                  type="time"
                  id="end-time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700"
              >
                Location
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="Conference Room A"
              />
            </div>

            {/* External / In-app toggle */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={useExternalLink}
                  onChange={(e) => setUseExternalLink(e.target.checked)}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                Use external meeting link
              </label>
              {useExternalLink && (
                <div className="mt-2">
                  <label
                    htmlFor="link"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    id="link"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="https://meet.google.com/..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to use in-app meeting.
                  </p>
                </div>
              )}
              {!useExternalLink && (
                <p className="mt-1 text-xs text-gray-500">
                  No link needed — meeting will run inside the app.
                </p>
              )}
            </div>

            {/* Participants */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Participants
              </label>
              <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                {orgMembers.map((member) => (
                  <label
                    key={member.user_id}
                    className="flex items-center gap-2 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedParticipants.includes(member.user_id)}
                      onChange={() => toggleParticipant(member.user_id)}
                      className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-900">
                      {member.users?.email || "Unknown"}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({member.role})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
            <button
              type="button"
              onClick={onCloseAction}
              className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded border border-gray-900 bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
