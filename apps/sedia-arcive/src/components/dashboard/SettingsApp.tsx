import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { signOut } from "../../lib/auth-client";

export default function SettingsApp() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout failed:", error);
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar
                activePage="settings"
                onCollapsedChange={setSidebarCollapsed}
                mobileMenuOpen={mobileMenuOpen}
                onMobileClose={() => setMobileMenuOpen(false)}
            />
            <div className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-16" : "md:ml-64"} ml-0`}>
                <Header
                    title="Settings"
                    onMobileMenuOpen={() => setMobileMenuOpen(true)}
                />
                <main className="p-6 max-w-3xl">
                    {/* Account Section */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-6">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">Account</h2>
                            <p className="text-sm text-gray-500 mt-1">Manage your account settings.</p>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Profile Information</p>
                                    <p className="text-xs text-gray-500">Update your name and profile picture</p>
                                </div>
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">Coming Soon</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                                    <p className="text-xs text-gray-500">Manage email preferences</p>
                                </div>
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">Coming Soon</span>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                                    <p className="text-xs text-gray-500">Add extra security to your account</p>
                                </div>
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">Coming Soon</span>
                            </div>
                        </div>
                    </div>

                    {/* Storage Section */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-6">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">Storage</h2>
                            <p className="text-sm text-gray-500 mt-1">Manage your storage and files.</p>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Storage Plan</p>
                                    <p className="text-xs text-gray-500">500 MB free storage</p>
                                </div>
                                <span className="text-xs px-2 py-1 bg-sky-100 text-sky-600 rounded">Free Plan</span>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Upgrade Storage</p>
                                    <p className="text-xs text-gray-500">Get more storage space</p>
                                </div>
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">Coming Soon</span>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white border border-red-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-red-100 bg-red-50">
                            <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
                            <p className="text-sm text-red-600 mt-1">Irreversible actions.</p>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Sign Out</p>
                                    <p className="text-xs text-gray-500">Log out of your account</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isLoggingOut ? "Signing out..." : "Sign Out"}
                                </button>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-sm font-medium text-red-600">Delete Account</p>
                                    <p className="text-xs text-gray-500">Permanently delete your account and all data</p>
                                </div>
                                <button disabled className="px-3 py-1.5 text-sm font-medium bg-red-50 text-red-400 rounded-lg cursor-not-allowed">
                                    Coming Soon
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
