export type { AuthUser } from "@/lib/permissions";

export type LeadWithRelations = {
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
  assignedTo: {
    id: string;
    name: string;
    email: string;
  } | null;
  notes: {
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
    };
  }[];
  activities: {
    id: string;
    action: string;
    previousValue: string | null;
    newValue: string | null;
    createdAt: string;
    actor: {
      id: string;
      name: string;
    } | null;
  }[];
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type UserSafe = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};
