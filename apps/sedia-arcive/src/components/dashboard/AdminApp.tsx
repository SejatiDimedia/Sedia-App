import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface UserPermission {
    id: string;
    role: string;
    uploadEnabled: boolean;
    storageLimit: number;
    storageUsed: number;
}

interface UserData {
    id: string;
    name: string;
    email: string;
    image: string | null;
    createdAt: string;
    permission: UserPermission | null;
}

export default function AdminApp() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/admin/users");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to load users");
            }

            setUsers(data.users);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load users");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleUploadEnabled = async (userId: string, currentValue: boolean) => {
        setUpdatingId(userId);
        try {
            const response = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, uploadEnabled: !currentValue }),
            });

            if (!response.ok) {
                throw new Error("Failed to update");
            }

            // Refresh users
            await fetchUsers();
        } catch (err) {
            console.error("Update error:", err);
        } finally {
            setUpdatingId(null);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (error?.includes("Admin access required") || error?.includes("Forbidden")) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Sidebar activePage="admin" onCollapsedChange={setSidebarCollapsed} />
                <div className={`transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
                    <Header title="Admin" />
                    <main className="p-6">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                            <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
                            <p className="text-red-600">You don't have admin privileges to access this page.</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar activePage="admin" onCollapsedChange={setSidebarCollapsed} />
            <div className={`transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
                <Header title="Admin - User Management" />
                <main className="p-6">
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">User List</h2>
                            <p className="text-sm text-gray-500 mt-1">Manage upload access for each user.</p>
                        </div>

                        {isLoading ? (
                            <div className="p-8 text-center">
                                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                <p className="text-gray-500 mt-3">Loading users...</p>
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center text-red-600">{error}</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Access</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {users.map((u) => (
                                            <tr key={u.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {u.image ? (
                                                            <img src={u.image} alt="" className="w-8 h-8 rounded-full" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                                                                <span className="text-sm font-medium text-sky-600">{u.name?.charAt(0) || "U"}</span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{u.name}</p>
                                                            {u.permission?.role === "admin" && (
                                                                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">Admin</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {u.permission ? (
                                                        <span>{formatSize(u.permission.storageUsed)} / {formatSize(u.permission.storageLimit)}</span>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {u.permission?.uploadEnabled ? (
                                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                            Enabled
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                            Disabled
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => toggleUploadEnabled(u.id, u.permission?.uploadEnabled ?? false)}
                                                        disabled={updatingId === u.id}
                                                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${u.permission?.uploadEnabled
                                                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                                                : "bg-sky-50 text-sky-600 hover:bg-sky-100"
                                                            }`}
                                                    >
                                                        {updatingId === u.id ? (
                                                            <span className="flex items-center gap-1">
                                                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                                Updating...
                                                            </span>
                                                        ) : u.permission?.uploadEnabled ? (
                                                            "Disable"
                                                        ) : (
                                                            "Enable Upload"
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
