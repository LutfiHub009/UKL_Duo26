"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, FolderKanban, Clock, ArrowRight } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/AuthGuard";
import { RoleGuard } from "@/components/RoleGuard";

type UserProfile = {
  id: number;
  username: string;
  fullname?: string;
  role?: string;
};

type ProjectItem = {
  id: number | string;
  title: string;
  description?: string;
  totalSpent?: string;
  totalCost?: number | string;
  cost?: number | string;
  status?: string;
  imageUrl?: string;
};

type ActivityItem = {
  id: number;
  projectName?: string;
  logName?: string;
  action?: string;
  description?: string;
  cost?: number;
  timestamp?: string;
  createdAt?: string;
};

type DashboardMetrics = {
  totalProjects: number;
  totalInvestment: number;
  recentUpdatesCount: number;
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setProfile(null);
      setProjects([]);
      setMetrics(null);
      setActivities([]);
      setIsLoading(true);

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = localStorage.getItem("token");

        if (!token) {
          router.push("/login");
          return;
        }

        const profileRes = await fetch(`${baseUrl}/auth/profile`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!profileRes.ok) {
          router.push("/login");
          return;
        }

        const profileData: UserProfile = await profileRes.json();
        setProfile(profileData);

        const [metricsRes, activityRes, projectsRes] = await Promise.all([
          fetch(`${baseUrl}/projects/dashboard/metrics`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${baseUrl}/projects/dashboard/activity-feed`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${baseUrl}/projects?userId=${profileData.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (metricsRes.ok) {
          setMetrics(await metricsRes.json());
        }

        if (activityRes.ok) {
          const activityData = await activityRes.json();
          const actList = Array.isArray(activityData)
            ? activityData
            : activityData?.data ?? activityData?.activities ?? [];
          setActivities(actList);
        }

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setProjects(Array.isArray(projectsData) ? projectsData : []);
        }
      } catch (err) {
        console.error("Customer Dashboard Fetch Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const displayTotalProjects =
    metrics !== null ? metrics.totalProjects : projects.length;

  const displayTotalInvestment =
    metrics !== null
      ? metrics.totalInvestment
      : projects.reduce(
          (acc, p) =>
            acc + Number(p.totalSpent || p.totalCost || p.cost || 0),
          0
        );

  const displayRecentActivity =
    metrics !== null ? metrics.recentUpdatesCount : activities.length;

  const activeBuilds = projects.filter(
    (p) =>
      !p.status ||
      p.status.toLowerCase() === "wip" ||
      p.status.toLowerCase() === "active"
  ).length;

  const completedBuilds = projects.filter(
    (p) => p.status?.toLowerCase() === "complete"
  ).length;

  const getActivityTitle = (item: ActivityItem): string =>
    item.projectName || item.logName || item.action || "Aktivitas baru";

  const getActivityDesc = (item: ActivityItem): string =>
    item.action || item.description || "Timeline diperbarui";

  const getActivityDate = (item: ActivityItem): string =>
    formatDate(item.timestamp || item.createdAt);

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["customer"]}>
        <div className="flex min-h-screen bg-background text-foreground font-sans transition-colors">
          <Sidebar activePage="dashboard" />

          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center flex-1 py-40 gap-2">
                <Loader2 className="animate-spin text-green-500" size={36} />
                <p className="text-sm text-muted-foreground">
                  Syncing customer dashboard...
                </p>
              </div>
            ) : (
              <div className="flex-1 px-8 pb-12 pt-6">
                {/* Greeting */}
                <div className="mb-8 flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                      Welcome back, {profile?.fullname || profile?.username || "Driver"}!
                    </h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      Customer Garage Overview
                    </p>
                  </div>
                  <span className="bg-green-500/10 text-green-500 border border-green-500/20 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                    Customer Space
                  </span>
                </div>

                {/* STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-muted-foreground">Total Projects</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                      </svg>
                    </div>
                    <div className="mt-4">
                      <p className="text-xl font-bold">{displayTotalProjects} Builds</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {activeBuilds} active, {completedBuilds} completed
                      </p>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-muted-foreground">Total Investment</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                        <polyline points="16 7 22 7 22 13" />
                      </svg>
                    </div>
                    <div className="mt-4">
                      <p className="text-xl font-bold">
                        IDR {Number(displayTotalInvestment).toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Across all your projects</p>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-muted-foreground">Recent Activity</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                        <line x1="16" x2="16" y1="2" y2="6" />
                        <line x1="8" x2="8" y1="2" y2="6" />
                        <line x1="3" x2="21" y1="10" y2="10" />
                      </svg>
                    </div>
                    <div className="mt-4">
                      <p className="text-xl font-bold">{displayRecentActivity} Updates</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Aktivitas terbaru Anda</p>
                    </div>
                  </div>
                </div>

                {/* RECENT PROJECTS */}
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">Your Recent Projects</h2>
                    <p className="text-muted-foreground text-xs mt-0.5">Quick access to your active garages</p>
                  </div>
                  <Link
                    href="/buildss"
                    className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-3 py-2 rounded-lg transition-colors"
                  >
                    View All <ArrowRight size={12} />
                  </Link>
                </div>

                {projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-xl bg-card text-muted-foreground text-center gap-2 mb-8">
                    <FolderKanban size={32} className="text-gray-500" />
                    <p className="text-sm font-medium">Belum ada project</p>
                    <p className="text-xs text-gray-500">
                      Buat project baru di halaman All Builds untuk mulai mendokumentasikan kendaraan Anda.
                    </p>
                    <Link
                      href="/buildss/new"
                      className="mt-1 text-xs font-semibold text-green-500 hover:underline"
                    >
                      + Tambah Project Baru
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    {projects.slice(0, 3).map((project) => (
                      <div
                        key={project.id}
                        onClick={() => router.push(`/buildss/${project.id}`)}
                        className="bg-card border border-border rounded-xl overflow-hidden flex flex-col cursor-pointer hover:border-neutral-700 transition-colors shadow-sm"
                      >
                        <div className="relative h-40 w-full bg-muted">
                          <img
                            src={project.imageUrl || "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=600&auto=format&fit=crop"}
                            alt={project.title}
                            className="w-full h-full object-cover opacity-80"
                          />
                          <span className={`absolute top-2.5 right-2.5 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            project.status?.toLowerCase() === "complete"
                              ? "bg-green-500/10 text-green-500 border border-green-500/20"
                              : "bg-neutral-800 text-white"
                          }`}>
                            {project.status || "WIP"}
                          </span>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-sm text-foreground truncate mb-1">
                            {project.title || "Untitled Project"}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {project.description || "Tidak ada deskripsi."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ACTIVITY FEED */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <Clock className="text-green-500" size={18} />
                    <h2 className="text-base font-bold tracking-tight">Your Activity Feed</h2>
                  </div>

                  {activities.length === 0 ? (
                    <div className="flex flex-col items-center py-8 gap-2 text-center">
                      <Clock size={28} className="text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground font-medium">
                        Belum ada aktivitas tercatat
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        Aktivitas akan muncul setelah Anda menambahkan timeline modifikasi pada project kendaraan.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {activities.map((item, idx) => (
                        <div
                          key={item.id ?? idx}
                          className="flex justify-between items-start py-3 border-b border-border/40 last:border-0 gap-4"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="mt-1.5 w-2 h-2 rounded-full bg-green-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {getActivityTitle(item)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {getActivityDesc(item)}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                            {getActivityDate(item)}
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
      </RoleGuard>
    </AuthGuard>
  );
}
