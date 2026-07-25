"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

type Lead = {
  id: string;
  name: string;
  email: string;
  company: string;
  source: string;
  status: string;
  createdAt: string;
  assignedTo: { id: string; name: string; email: string } | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export default function LeadsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();

      if (res.ok) {
        setLeads(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchLeads(1);
  }, [fetchLeads]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin
              ? "Manage all leads across your team"
              : "View and update your assigned leads"}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {pagination.total} total leads
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No leads found
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                {isAdmin && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      {lead.name}
                    </Link>
                    <p className="text-xs text-gray-500">{lead.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {lead.company}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 capitalize">
                    {lead.source.replace("_", " ")}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {lead.assignedTo?.name || (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchLeads(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => fetchLeads(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
