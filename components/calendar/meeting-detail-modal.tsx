"use client";

import type { Meeting } from "./types";
import { useState, useEffect } from "react";
import { MeetingAgenda } from "@/components/meeting/meeting-agenda";

type MeetingDetailModalProps = {
  meeting: Meeting;
  userId: string;
  userRole: "owner" | "manager" | "member";
  orgSlug: string;
  onCloseAction: () => void;
};

export function MeetingDetailModal({
  meeting,
  userId,
  userRole,
  orgSlug,
  onCloseAction,
}: MeetingDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state - convert UTC to local time for editing
  const startDate = new Date(meeting.start_time);
  const endDate = meeting.end_time ? new Date(meeting.end_time) : null;

  const [editTitle, setEditTitle] = useState(meeting.title);
  const [editDescription, setEditDescription] = useState(
    meeting.description || "",
  );
  const [editDate, setEditDate] = useState(
    `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`,
  );
  const [editStartTime, setEditStartTime] = useState(
    `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`,
  );
  const [editEndTime, setEditEndTime] = useState(
    endDate
      ? `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`
      : "",
  );
  const [editLocation, setEditLocation] = useState(meeting.location || "");

  const isCreator = meeting.created_by === userId;
  const canEdit = isCreator || userRole === "owner" || userRole === "manager";
  const canDelete = isCreator || userRole === "owner";

  const myParticipation = meeting.meeting_participants?.find(
    (p) => p.user_id === userId,
  );
  const myStatus = myParticipation?.status || "pending";

  // Fetch recordings
  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const res = await fetch(
          `/api/${orgSlug}/meetings/${meeting.id}/recordings`,
        );
        if (res.ok) {
          const data = await res.json();
          setRecordings(data);
        }
      } catch (error) {
        console.error("Failed to fetch recordings:", error);
      } finally {
        setLoadingRecordings(false);
      }
    };

    fetchRecordings();
  }, [orgSlug, meeting.id]);

  const handleStatusChange = async (status: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/${orgSlug}/meetings/${meeting.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update status");
      }
      window.location.reload();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this meeting?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/${orgSlug}/meetings/${meeting.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete meeting");
      }
      onCloseAction();
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete meeting:", error);
      alert("Failed to delete meeting");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsUpdating(true);
    try {
      // Parse as local time and convert to ISO string (UTC)
      const startDate = new Date(`${editDate}T${editStartTime}:00`);
      const startDateTime = startDate.toISOString();

      let endDateTime = null;
      if (editEndTime) {
        const endDate = new Date(`${editDate}T${editEndTime}:00`);
        endDateTime = endDate.toISOString();
      }

      const res = await fetch(`/api/${orgSlug}/meetings/${meeting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          start_time: startDateTime,
          end_time: endDateTime,
          location: editLocation,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update meeting");
      }

      alert("Meeting updated! Participants have been notified.");
      window.location.reload();
    } catch (error) {
      console.error("Failed to update meeting:", error);
      alert("Failed to update meeting");
    } finally {
      setIsUpdating(false);
    }
  };

  const statusColors = {
    pending: "border-gray-200 bg-gray-50 text-gray-700",
    accepted: "border-green-200 bg-green-50 text-green-700",
    declined: "border-red-200 bg-red-50 text-red-700",
    maybe: "border-yellow-200 bg-yellow-50 text-yellow-700",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {!isEditing ? (
                <>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {meeting.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Created by{" "}
                    {meeting.creator?.users?.email ||
                      meeting.created_by ||
                      "Unknown"}
                  </p>

                  {/* Join Meeting Button */}
                  <div className="mt-3 flex gap-2">
                    <a
                      href={`/${orgSlug}/meetings/${meeting.id}/room`}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      🎥 Join Meeting
                    </a>
                    {canEdit && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        ✏️ Edit
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Edit Meeting
                  </h2>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Meeting title"
                  />
                </div>
              )}
            </div>
            <button
              onClick={onCloseAction}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-h-[calc(100vh-200px)] space-y-6 overflow-y-auto p-6">
          {isEditing ? (
            <>
              {/* Edit Form */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Meeting description"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Conference Room A"
                />
              </div>

              <div className="flex gap-3 border-t border-gray-200 pt-4">
                <button
                  onClick={handleSaveEdit}
                  disabled={isUpdating}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isUpdating}
                  className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Description */}
              {meeting.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Description
                  </h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {meeting.description}
                  </p>
                </div>
              )}

              {/* Time */}
              <div>
                <h3 className="text-sm font-medium text-gray-700">Time</h3>
                <div className="mt-1 text-sm text-gray-900">
                  {new Date(meeting.start_time).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  <br />
                  {new Date(meeting.start_time).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {new Date(meeting.end_time).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {/* Location */}
              {meeting.location && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Location
                  </h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {meeting.location}
                  </p>
                </div>
              )}

              {/* Meeting Link / In-app join */}
              <div>
                <h3 className="text-sm font-medium text-gray-700">Join</h3>
                {meeting.meeting_link ? (
                  <a
                    href={meeting.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm text-blue-600 hover:underline"
                  >
                    Open External Meeting →
                  </a>
                ) : (
                  <a
                    href={`/${orgSlug}/meetings/${meeting.id}`}
                    className="mt-1 inline-block text-sm text-blue-600 hover:underline"
                  >
                    Join In-App Meeting →
                  </a>
                )}
              </div>

              {/* Participants */}
              <div>
                <h3 className="text-sm font-medium text-gray-700">
                  Participants ({meeting.meeting_participants?.length || 0})
                </h3>
                <div className="mt-2 space-y-2">
                  {meeting.meeting_participants?.map((p) => (
                    <div
                      key={p.user_id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-2"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {p.participant?.users?.email || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {p.participant?.role}
                        </div>
                      </div>
                      <span
                        className={`rounded border px-2 py-0.5 text-xs font-medium ${statusColors[p.status as keyof typeof statusColors]}`}
                      >
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agenda */}
              <MeetingAgenda
                orgSlug={orgSlug}
                meetingId={meeting.id}
                userId={userId}
                userRole={userRole}
                orgMembers={
                  meeting.meeting_participants
                    ?.map((p) => p.participant)
                    .filter(Boolean) as any
                }
              />

              {/* Recordings */}
              <div>
                <h3 className="text-sm font-medium text-gray-700">
                  Recordings
                </h3>
                {loadingRecordings ? (
                  <p className="mt-2 text-sm text-gray-500">Loading...</p>
                ) : recordings.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">
                    No recordings yet
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {recordings.map((recording) => (
                      <div
                        key={recording.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(recording.created_at).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {recording.creator?.email} •{" "}
                            {(recording.file_size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                        {recording.url && (
                          <a
                            href={recording.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            Play
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* My Response */}
              {myParticipation && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Your Response
                  </h3>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleStatusChange("accepted")}
                      disabled={isUpdating}
                      className={`rounded border px-3 py-1.5 text-sm ${
                        myStatus === "accepted"
                          ? "border-green-600 bg-green-600 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusChange("maybe")}
                      disabled={isUpdating}
                      className={`rounded border px-3 py-1.5 text-sm ${
                        myStatus === "maybe"
                          ? "border-yellow-600 bg-yellow-600 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Maybe
                    </button>
                    <button
                      onClick={() => handleStatusChange("declined")}
                      disabled={isUpdating}
                      className={`rounded border px-3 py-1.5 text-sm ${
                        myStatus === "declined"
                          ? "border-red-600 bg-red-600 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between border-t border-gray-200 p-6">
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded border border-red-600 bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete Meeting"}
            </button>
          )}
          <button
            onClick={onCloseAction}
            className="ml-auto rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
