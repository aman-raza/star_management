"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function UsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "admin";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAdmin && session) {
      router.push("/dashboard");
    }
  }, [isAdmin, session, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const fieldErrors: Record<string, string> = {};
          for (const detail of data.details) {
            fieldErrors[detail.field] = detail.message;
          }
          setErrors(fieldErrors);
        } else {
          setErrors({ _form: data.error || "Failed to create user" });
        }
        return;
      }

      setFormData({ name: "", email: "", password: "", role: "member" });
      fetchUsers();
    } catch {
      setErrors({ _form: "Network error. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create and manage team members and permissions
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Left: User List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Team Members
            </h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No users found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right: Create User Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Add New User
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors._form && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{errors._form}</p>
              </div>
            )}

            <div>
              <label htmlFor="user-name" className="block text-xs font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="user-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Sarah Connor"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="user-email" className="block text-xs font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="user-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="sarah@starmanagement.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="user-password" className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="user-password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="user-role" className="block text-xs font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="user-role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Creating..." : "Create User"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
