"use client";

import { useState } from "react";

type NoteFormProps = {
  leadId: string;
  onNoteAdded: () => void;
};

export default function NoteForm({ leadId, onNoteAdded }: NoteFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add note");
        return;
      }

      setContent("");
      onNoteAdded();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-2">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a note..."
        rows={3}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Adding..." : "Add Note"}
        </button>
      </div>
    </form>
  );
}
