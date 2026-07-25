import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SessionProvider } from "next-auth/react";
import DashboardNav from "@/components/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-800">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-semibold">Star Management</span>
            </Link>
          </div>

          <DashboardNav role={session.user.role} />

          {/* User info */}
          <div className="mt-auto p-4 border-t border-gray-800">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-medium">
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{session.user.name}</p>
                <p className="text-xs text-gray-400 capitalize">{session.user.role}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {children}
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}
