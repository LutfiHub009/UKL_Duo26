"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Plus, Search, Edit2, Trash2, FolderKanban,
  Users, Eye, Car, ShieldCheck, Clock
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/AuthGuard";

type ProjectItem = {
  id: number;
  title: string;
  description?: string;
  totalSpent?: string;
  totalCost?: number | string;
  status?: string;
  imageUrl?: string;
  userId: number;
  // Some backends include nested user object
  user?: { id: number; username?: string; fullname?: string };
};

type UserProfile = {
  id: number;
  username: string;
  fullname?: string;
  role?: string;
  roles?: string[];
};

const STATUS_FILTERS = ["All", "WIP", "Complete", "Planning"];

export default function BuildssPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<"mods" | "customer" | null>(null);

  const fetchProjects = async (profile: UserProfile, role: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token");

      // Moderator: semua project; Customer: hanya project miliknya
      const url =
        role === "customer"
          ? `${baseUrl}/projects?userId=${profile.id}`
          : `${baseUrl}/projects`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Gagal memuat data proyek.");
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = localStorage.getItem("token");

        if (!token) {
          router.push("/login");
          return;
        }

        const profileRes = await fetch(`${baseUrl}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!profileRes.ok) {
          router.push("/login");
          return;
        }

        const profileData: UserProfile = await profileRes.json();
        setCurrentUser(profileData);

        const role = (
          profileData.role || profileData.roles?.[0] || "customer"
        ).toLowerCase() as "mods" | "customer";
        setUserRole(role);

        await fetchProjects(profileData, role);
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (activeFilter !== "All") {
      result = result.filter(
        (p) => p.status?.toLowerCase() === activeFilter.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [searchQuery, activeFilter, projects]);

  const handleDelete = async (projectId: number) => {
    const confirmed = window.confirm("Hapus project ini secara permanen?");
    if (!confirmed) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token");

      const res = await fetch(`${baseUrl}/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Gagal menghapus project.");
      toast.success("Project berhasil dihapus.");
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const getDisplayCost = (project: ProjectItem) => {
    const raw = project.totalSpent ?? project.totalCost ?? 0;
    const num = Number(raw);
    return isNaN(num) ? "0" : num.toLocaleString("id-ID");
  };

  // Ambil nama requester dari project (user object kalau ada, fallback ke userId)
  const getRequesterName = (project: ProjectItem) => {
    if (project.user?.username) return project.user.username;
    if (project.user?.fullname) return project.user.fullname;
    return `User #${project.userId}`;
  };

  const getStatusColors = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === "complete")
      return "bg-green-500/20 text-green-400 border border-green-500/30";
    if (s === "planning")
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    return "bg-black/60 text-white border border-white/10";
  };

  const isMods = userRole === "mods";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-green-500" size={40} />
          <p className="text-sm text-muted-foreground">Memuat data build...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <Toaster position="top-right" richColors />
      <div className="flex flex-col md:flex-row bg-background text-foreground min-h-screen font-sans">
        <Sidebar activePage="builds" />

        <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full overflow-y-auto">
          {/* ==================== HEADER ==================== */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                {isMods ? (
                  <>
                    <Users size={22} className="text-blue-400" />
                    All Customer Builds
                  </>
                ) : (
                  <>
                    <Car size={22} className="text-green-500" />
                    My Vehicle Builds
                  </>
                )}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isMods
                  ? `${projects.length} total project dari semua customer`
                  : `${projects.length} project build kendaraan Anda`}
              </p>
            </div>

            {/* Customer: tombol buat project baru */}
            {!isMods && (
              <button
                onClick={() => router.push("/buildss/new")}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                <Plus size={16} /> New Build
              </button>
            )}
          </div>

          {/* ==================== ROLE BADGE ==================== */}
          <div className="mb-5">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border ${
                isMods
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : "bg-green-500/10 text-green-500 border-green-500/20"
              }`}
            >
              {isMods ? (
                <>
                  <ShieldCheck size={12} /> Moderator — Tracking semua customer
                  builds
                </>
              ) : (
                <>
                  <Car size={12} /> Customer — Daftar kendaraan build Anda
                </>
              )}
            </span>
          </div>

          {/* ==================== SEARCH ==================== */}
          <div className="relative mb-4">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isMods ? "Search all builds..." : "Search your builds..."
              }
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-green-500/50 transition-colors"
            />
          </div>

          {/* ==================== STATUS FILTER ==================== */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide mr-1">
              Filter:
            </span>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg border transition-colors ${
                  activeFilter === f
                    ? "bg-green-500 text-black border-green-500"
                    : "bg-transparent text-muted-foreground border-border hover:border-green-500/40"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* ==================== EMPTY STATE ==================== */}
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 border border-dashed border-border rounded-2xl bg-card text-center gap-3 mt-4">
              <FolderKanban size={40} className="text-muted-foreground/50" />
              <div>
                <p className="text-base font-semibold text-foreground">
                  {isMods
                    ? "Belum ada project dari customer"
                    : "Belum ada project build"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isMods
                    ? "Project yang dibuat oleh customer akan muncul di sini untuk Anda track."
                    : "Buat project baru untuk mendokumentasikan build kendaraan Anda!"}
                </p>
              </div>
              {!isMods && (
                <button
                  onClick={() => router.push("/buildss/new")}
                  className="mt-2 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
                >
                  <Plus size={15} /> Buat Project Pertama
                </button>
              )}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-2xl bg-card text-center gap-2 mt-4">
              <Search size={32} className="text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">
                Tidak ada project yang cocok
              </p>
              <p className="text-xs text-muted-foreground">
                Coba ubah kata kunci atau filter status.
              </p>
            </div>
          ) : (
            /* ==================== PROJECT GRID ==================== */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className={`bg-card border rounded-2xl overflow-hidden shadow-sm transition-all flex flex-col hover:shadow-md hover:-translate-y-0.5 duration-200 ${
                    isMods
                      ? "border-border hover:border-blue-500/40"
                      : "border-green-500/20 hover:border-green-500/60"
                  }`}
                >
                  {/* Project Image */}
                  <div
                    className="relative h-48 w-full bg-muted cursor-pointer overflow-hidden"
                    onClick={() => router.push(`/buildss/${project.id}`)}
                  >
                    <img
                      src={
                        project.imageUrl ||
                        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600"
                      }
                      alt={project.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />

                    {/* Status Badge */}
                    <span
                      className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${getStatusColors(
                        project.status
                      )}`}
                    >
                      {project.status || "WIP"}
                    </span>

                    {/* Moderator: "Requested by" overlay badge */}
                    {isMods && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                        <p className="text-[11px] text-white/80 font-medium">
                          Requested by{" "}
                          <span className="text-green-400 font-bold">
                            {getRequesterName(project)}
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Customer: "My Build" badge */}
                    {!isMods && (
                      <span className="absolute top-3 left-3 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-green-500 text-black">
                        My Build
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <h3
                        className="font-bold text-base text-foreground truncate cursor-pointer hover:text-green-500 transition-colors"
                        onClick={() => router.push(`/buildss/${project.id}`)}
                      >
                        {project.title}
                      </h3>

                      {/* Requested by (text inside card body for mods) */}
                      {isMods && (
                        <p className="text-[11px] text-blue-400/80 mt-1 font-medium">
                          Requested by:{" "}
                          <span className="text-blue-400 font-bold">
                            {getRequesterName(project)}
                          </span>
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                        {project.description || "Tidak ada deskripsi."}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div>
                      {/* Customer: hanya bisa lihat timeline */}
                      {!isMods && (
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() =>
                              router.push(`/buildss/${project.id}`)
                            }
                            className="flex items-center gap-1.5 text-xs font-semibold text-green-500 hover:text-green-400 border border-green-500/30 hover:border-green-500/70 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Eye size={12} /> Lihat Timeline
                          </button>
                        </div>
                      )}

                      {/* Moderator: Manage Timeline + Edit + Delete */}
                      {isMods && (
                        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                          <button
                            onClick={() =>
                              router.push(`/buildss/${project.id}`)
                            }
                            className="flex items-center gap-1 text-xs font-semibold text-green-500 hover:text-green-400 border border-green-500/20 hover:border-green-500/60 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <Clock size={11} /> Timeline
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/buildss/${project.id}/edit`)
                            }
                            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:border-foreground/40 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <Edit2 size={11} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-red-500 border border-border hover:border-red-500/40 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 size={11} /> Hapus
                          </button>
                        </div>
                      )}

                      {/* Total cost */}
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          Total Cost:
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          IDR {getDisplayCost(project)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}