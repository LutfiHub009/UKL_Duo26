"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, FolderKanban, Clock } from "lucide-react"; // Menambahkan icon Clock untuk feed
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/AuthGuard";
import Image from "next/image";

// Struktur data Profil
type UserProfile = {
  id: number;
  username: string;
  fullname?: string;
};

// Struktur data Project dari database menggunakan field 'title'
type ProjectItem = {
  id: number | string;
  title: string;
  description?: string;
  totalCost?: number | string;
  cost?: number | string;
  status?: string;
  imageUrl?: string;
  progress?: number | string;
};

// Struktur data item aktivitas sesuai respons Swagger Anda
type ActivityItem = {
  id: number;
  projectName: string;
  action: string; // Misal: "Created new build", "Updated suspension"
  timestamp: string; // Waktu rekaman aktivitas
};

// Tipe data metrik sesuai respons Swagger Anda
type DashboardMetrics = {
  totalProjects: number;
  totalInvestment: number;
  recentUpdatesCount: number;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]); // State penampung activity feed
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = localStorage.getItem("token");

        // 1. Ambil data profil terlebih dahulu untuk mendapatkan userId resmi
        const profileRes = await fetch(`${baseUrl}/auth/profile`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!profileRes.ok) throw new Error("Gagal memuat profil.");
        const profileData = await profileRes.json();
        setProfile(profileData);

        // 2. Memanggil API Metrik & Activity Feed
        const [metricsRes, activityRes] = await Promise.all([
          fetch(`${baseUrl}/projects/dashboard/metrics`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${baseUrl}/projects/dashboard/activity-feed`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData);
        }

        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setActivities(Array.isArray(activityData) ? activityData : []); // Mengisi state activity feed
        }

        // 3. Ambil project milik user tersebut (GET /projects?userId=id)
        if (profileData && profileData.id) {
          const projectsRes = await fetch(
            `${baseUrl}/projects?userId=${profileData.id}`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (projectsRes.ok) {
            const projectsData = await projectsRes.json();
            setProjects(Array.isArray(projectsData) ? projectsData : []);
          }
        }
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // --- PEMBARUAN INFORMASI METRIK ---
  const displayTotalProjects =
    metrics !== null ? metrics.totalProjects : projects.length;
  const displayTotalInvestment =
    metrics !== null
      ? metrics.totalInvestment
      : projects.reduce(
          (acc, p) => acc + Number(p.totalCost || p.cost || 0),
          0,
        );
  const displayRecentActivity =
    metrics !== null ? metrics.recentUpdatesCount : 0;

  // Filter status pembantu untuk sub-info teks stat card
  const activeBuilds = projects.filter(
    (p) =>
      !p.status ||
      p.status.toLowerCase() === "wip" ||
      p.status.toLowerCase() === "active",
  ).length;
  const completedBuilds = projects.filter(
    (p) => p.status && p.status.toLowerCase() === "complete",
  ).length;

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background text-foreground font-sans transition-colors">
        {/* SIDEBAR */}
        <Sidebar activePage="dashboard" />

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center flex-1 py-40 gap-2">
              <Loader2 className="animate-spin text-green-500" size={36} />
              <p className="text-sm text-muted-foreground">
                Syncing dashboard metrics...
              </p>
            </div>
          ) : (
            /* DASHBOARD BODY */
            <div className="flex-1 px-8 pb-12 pt-6">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  Welcome back,{" "}
                  {profile?.fullname || profile?.username || "Driver"}!
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Heres an overview of your build projects
                </p>
              </div>

              {/* STATS CARDS ROW DATA DARI API BACKEND */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Total Projects */}
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">
                      Total Projects
                    </span>
                    <span className="text-muted-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xl font-bold text-foreground">
                      {displayTotalProjects} Builds
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeBuilds} active, {completedBuilds} completed
                    </p>
                  </div>
                </div>

                {/* Total Investment */}
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">
                      Total Investment
                    </span>
                    <span className="text-muted-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                        <polyline points="16 7 22 7 22 13" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xl font-bold text-foreground">
                      ${displayTotalInvestment.toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Across all projects
                    </p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">
                      Recent Activity
                    </span>
                    <span className="text-muted-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          width="18"
                          height="18"
                          x="3"
                          y="4"
                          rx="2"
                          ry="2"
                        />
                        <line x1="16" x2="16" y1="2" y2="6" />
                        <line x1="8" x2="8" y1="2" y2="6" />
                        <line x1="3" x2="21" y1="10" y2="10" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xl font-bold text-foreground">
                      {displayRecentActivity} Updates
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      aktivitas modifikasi terbaru
                    </p>
                  </div>
                </div>
              </div>

              {/* RECENT PROJECTS SECTION */}
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground tracking-tight">
                    Recent Projects
                  </h2>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Your latest build updates
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-3 py-2 rounded-lg transition-colors"
                >
                  View Profile
                </Link>
              </div>

              {/* PROJECT GRID CARDS */}
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-xl bg-card text-muted-foreground text-center gap-2 mb-8">
                  <FolderKanban size={32} className="text-gray-500" />
                  <p className="text-sm font-medium">No projects found</p>
                  <p className="text-xs text-gray-500">
                    Create a project in your database to see it on the
                    dashboard.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                  {projects.slice(0, 3).map((project) => {
                    return (
                      <div
                        key={project.id}
                        className="bg-card border border-border rounded-xl overflow-hidden flex flex-col justify-between p-4 shadow-sm"
                      >
                        <div>
                          <div className="relative h-40 w-full rounded-lg overflow-hidden bg-muted mb-4">
                            <Image
                              src={
                                project.imageUrl ||
                                "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=600&auto=format&fit=crop"
                              }
                              alt={project.title}
                              className="w-full h-full object-cover opacity-80"
                              width={400}
                              height={240}
                            />
                            <span
                              className={`absolute top-2.5 right-2.5 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                project.status?.toLowerCase() === "complete"
                                  ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                  : "bg-neutral-800 text-white"
                              }`}
                            >
                              {project.status || "WIP"}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-foreground truncate mb-1">
                            {project.title || "Untitled Project"}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                            {project.description || "No description provided."}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* (ACTIVITY FEED) */}
              <div className="bg-card border border-border rounded-xl p-6 mt-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="text-green-500" size={18} />
                  <h2 className="text-base font-bold text-foreground tracking-tight">
                    Recent Activity Feed
                  </h2>
                </div>

                {activities.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">
                    No recent updates found. Start managing your vehicle
                    components to trigger activity logs.
                  </p>
                ) : (
                  <div className="space-y-3.5">
                    {activities.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center border-b border-border/40 pb-3 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {item.projectName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.action}
                          </p>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(item.timestamp).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
