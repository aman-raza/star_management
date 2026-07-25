const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: {
    label: "New",
    className: "bg-blue-100 text-blue-800",
  },
  contacted: {
    label: "Contacted",
    className: "bg-yellow-100 text-yellow-800",
  },
  qualified: {
    label: "Qualified",
    className: "bg-purple-100 text-purple-800",
  },
  proposal: {
    label: "Proposal",
    className: "bg-orange-100 text-orange-800",
  },
  won: {
    label: "Won",
    className: "bg-green-100 text-green-800",
  },
  lost: {
    label: "Lost",
    className: "bg-red-100 text-red-800",
  },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
