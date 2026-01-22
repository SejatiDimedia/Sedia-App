import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function TeamApp() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar
                activePage="team"
                onCollapsedChange={setSidebarCollapsed}
                mobileMenuOpen={mobileMenuOpen}
                onMobileClose={() => setMobileMenuOpen(false)}
            />
            <div className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-16" : "md:ml-64"} ml-0`}>
                <Header
                    title="Team"
                    onMobileMenuOpen={() => setMobileMenuOpen(true)}
                />
                <main className="p-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-sky-100 flex items-center justify-center">
                            <svg className="w-10 h-10 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Team Collaboration</h2>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                            Invite team members to collaborate on your files and folders. Share access and work together seamlessly.
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Coming Soon
                        </div>
                    </div>

                    {/* Features Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Invite Members</h3>
                            <p className="text-sm text-gray-500">Add team members via email and manage their access permissions.</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Share Folders</h3>
                            <p className="text-sm text-gray-500">Share specific folders with team members for organized collaboration.</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Role Permissions</h3>
                            <p className="text-sm text-gray-500">Set view-only or edit permissions for each team member.</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
