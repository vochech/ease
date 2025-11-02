"use client";

import { useState } from "react";
import { CreateProjectForm } from "./create-project-form";

type CreateProjectModalProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  onSuccessAction: () => void;
};

export function CreateProjectModal({
  isOpen,
  onCloseAction,
  onSuccessAction,
}: CreateProjectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onCloseAction}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold">Create New Project</h2>
        <CreateProjectForm
          onCloseAction={onCloseAction}
          onSuccessAction={onSuccessAction}
        />
      </div>
    </div>
  );
}
