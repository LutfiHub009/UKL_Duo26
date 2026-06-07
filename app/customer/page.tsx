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
                <div className="mb-8 flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        Selamat datang, {profile?.fullname || profile?.username || "Driver"}!
                      </h1>
                      <p className="text-muted-foreground text-sm mt-0.5">
                        Customer Dashboard
                      </p>
                    </div>
                    <span className="bg-green-500/10 text-green-500 border border-green-500/20 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                      Customer Space
                    </span>
                  </div>

                  <div className="max-w-2xl">
                    <p className="text-lg font-semibold text-foreground">
                      Selamat datang di dashboard customer. ajukan build mobil Anda dan kelola proyek kendaraan dengan mudah bersama mekanik kami.
                    </p>
                    <p className="text-sm text-muted-foreground mt-3">
                      Lihat  build anda dan aktivitas yang sedang berjalan dan detail kendaraan melalui halaman &apos;My Builds&apos;.
                    </p>
                  </div>

                  <Link
                    href="/buildss"
                    className="mt-6 inline-flex items-center justify-center rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600"
                  >
                    Buka My Builds
                  </Link>
                </div>

    
              </div>
            )}
          </main>
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
