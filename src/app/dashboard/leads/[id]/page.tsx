"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import ActivityTimeline from "@/components/ActivityTimeline";
import NoteForm from "@/components/NoteForm";

type Lead = {
  id: string;
  name: string;
  email: string;
  company: string;
  message: string;
  source: string;
  status: string;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; name: string; email: string } | null;
  notes: {
    id: string;
    content: string;
    createdAt: string;
    author: { id: string; name: string };
  }[];
};

type Member = {
  id: string;
  name: string;
  email: string;
};

const STATUSES = ["new", "contacted", "qualified", "proposal", "won", "lost"];

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "admin";

  const [lead, setLead] = useState<Lead | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [assignUpdating, setAssignUpdating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchLead = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (res.status === 404 || res.status === 403) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      if (res.ok) setLead(data.data);
    } catch (error) {
      console.error("Failed to fetch lead:", error);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  useEffect(() => {
    if (isAdmin) {
      fetch("/api/users/members")
        .then((res) => res.json())
        .then((data) => setMembers(data.data || []))
        .catch(console.error);
    }
  }, [isAdmin]);

  async function handleStatusChange(newStatus: string) {
    if (!lead) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchLead();
        setRefreshKey((k) => k + 1);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleAssign(assignedToId: string) {
    setAssignUpdating(true);
    try {
      const res = await fetch(`/api/leads/${id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedToId: assignedToId || null,
        }),
      });
      if (res.ok) {
        await fetchLead();
        setRefreshKey((k) => k + 1);
      }
    } catch (error) {
      console.error("Failed to assign lead:", error);
    } finally {
      setAssignUpdating(false);
    }
  }

  function handleNoteAdded() {
    fetchLead();
    setRefreshKey((k) => k + 1);
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-48 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Lead not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button + Header */}
      <div>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-gray-500 hover:text-gray-700 mb-3 inline-flex items-center gap-1 cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Leads
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{lead.email} · {lead.company}</p>
          </div>
          <StatusBadge status={lead.status} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead Details Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Lead Details
            </h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-gray-500">Source</dt>
                <dd className="text-sm text-gray-900 capitalize mt-0.5">
                  {lead.source.replace("_", " ")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Assigned To</dt>
                <dd className="text-sm text-gray-900 mt-0.5">
                  {lead.assignedTo?.name || (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900 mt-0.5">
                  {new Date(lead.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Last Updated</dt>
                <dd className="text-sm text-gray-900 mt-0.5">
                  {new Date(lead.updatedAt).toLocaleString()}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-gray-500">Message</dt>
                <dd className="text-sm text-gray-900 mt-0.5">{lead.message}</dd>
              </div>
            </dl>
          </div>

          {/* Status Update */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Update Status
            </h2>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={status === lead.status || statusUpdating}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                    status === lead.status
                      ? "bg-indigo-100 text-indigo-700 cursor-default"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Assignment (Admin only) */}
          {isAdmin && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Assign Lead
              </h2>
              <select
                value={lead.assignedToId || ""}
                onChange={(e) => handleAssign(e.target.value)}
                disabled={assignUpdating}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Notes
            </h2>
            <NoteForm leadId={id} onNoteAdded={handleNoteAdded} />

            {lead.notes.length > 0 && (
              <div className="mt-6 space-y-4">
                {lead.notes.map((note) => (
                  <div key={note.id} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {note.author.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Activity Timeline */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Activity
            </h2>
            <ActivityTimeline key={refreshKey} leadId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}
