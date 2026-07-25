"use client";

import { useEffect, useState } from "react";

type ActivityEntry = {
  id: string;
  action: string;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
  actor: { id: string; name: string } | null;
};

const ACTION_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  lead_created: { label: "Lead Created", icon: "🆕", color: "text-blue-600" },
  status_change: { label: "Status Changed", icon: "🔄", color: "text-yellow-600" },
  assignment_change: { label: "Assignment Changed", icon: "👤", color: "text-purple-600" },
  note_added: { label: "Note Added", icon: "📝", color: "text-green-600" },
};

export default function ActivityTimeline({ leadId }: { leadId: string }) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/leads/${leadId}/activity`)
      .then((res) => res.json())
      .then((data) => setActivities(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [leadId]);

  if (loading) {
    return <div className="animate-pulse space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded" />)}
    </div>;
  }

  if (activities.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>;
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, idx) => {
          const config = ACTION_CONFIG[activity.action] || {
            label: activity.action,
            icon: "📋",
            color: "text-gray-600",
          };

          return (
            <li key={activity.id}>
              <div className="relative pb-8">
                {idx < activities.length - 1 && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 ring-2 ring-white text-sm">
                    {config.icon}
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-900">
                        <span className={`font-medium ${config.color}`}>
                          {config.label}
                        </span>
                        {activity.actor && (
                          <span className="text-gray-500">
                            {" "}by {activity.actor.name}
                          </span>
                        )}
                      </p>
                      {(activity.previousValue || activity.newValue) && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          {activity.previousValue && activity.newValue
                            ? `${activity.previousValue} → ${activity.newValue}`
                            : activity.newValue || ""}
                        </p>
                      )}
                    </div>
                    <div className="whitespace-nowrap text-right text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
