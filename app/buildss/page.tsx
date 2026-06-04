"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search, Edit2, Trash2, FolderKanban } from "lucide-react";
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
};

const STATUS_FILTERS = ["All", "WIP", "Complete", "Planning"];

export default function BuildssPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // =====================================================
  // Fetch hanya project milik user yang sedang login
  // dengan mengambil userId dari API /auth/profile
  // =====================================================
  const fetchUserProjects = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      // Selalu ambil userId dari API, bukan localStorage
      const profileRes = await fetch(`${baseUrl}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!profileRes.ok) {
        router.push("/login");
        return;
      }

      const profileData = await profileRes.json();
      setCurrentUserId(profileData.id);

      // Fetch hanya project milik userId ini
      const projectsRes = await fetch(
        `${baseUrl}/projects?userId=${profileData.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!projectsRes.ok) throw new Error("Gagal memuat data proyek.");

      const data = await projectsRes.json();
      const userProjects: ProjectItem[] = Array.isArray(data) ? data : [];
      setProjects(userProjects);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      // Reset state agar data akun lama tidak tertinggal
      setProjects([]);
      await fetchUserProjects();
      setIsLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter & search handler
  // useMemo menggantikan useEffect+setState untuk filter/search
  // agar tidak trigger cascading renders
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
    const confirm = window.confirm("Hapus project ini secara permanen?");
    if (!confirm) return;

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin text-green-500" size={40} />
      </div>
    );
  }

  return (
    <AuthGuard>
      <Toaster position="top-right" richColors />
      <div className="flex flex-col md:flex-row bg-background text-foreground min-h-screen font-sans">
        <Sidebar activePage="builds" />

        <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">All Builds</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {projects.length > 0
                  ? `${projects.length} project kendaraan milik Anda`
                  : "Belum ada project — mulai tambahkan kendaraan Anda"}
              </p>
            </div>
            <button
              onClick={() => router.push("/buildss/new")}
              className="flex items-center gap-2 bg-foreground hover:bg-foreground/80 text-background text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <Plus size={16} /> New Project
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search builds by title or component description..."
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-green-500/50 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide mr-1">
              Filter by build status:
            </span>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg border transition-colors ${
                  activeFilter === f
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Empty State — jika user belum punya project sama sekali */}
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 border border-dashed border-border rounded-2xl bg-card text-center gap-3 mt-4">
              <FolderKanban size={40} className="text-muted-foreground/50" />
              <div>
                <p className="text-base font-semibold text-foreground">
                  Belum ada project kendaraan
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Klik tombol New Project untuk mulai mendokumentasikan build kendaraan Anda.
                </p>
              </div>
              <button
                onClick={() => router.push("/buildss/new")}
                className="mt-2 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
              >
                <Plus size={15} /> Tambah Project Pertama
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            /* Empty state saat filter/search tidak menemukan hasil */
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
            /* Project Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:border-neutral-700 transition-colors flex flex-col"
                >
                  {/* Gambar project — klik navigasi ke detail */}
                  <div
                    className="relative h-48 w-full bg-muted cursor-pointer"
                    onClick={() => router.push(`/buildss/${project.id}`)}
                  >
                    <img
                      src={
                        project.imageUrl ||
                        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600"
                      }
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                        project.status?.toLowerCase() === "complete"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : project.status?.toLowerCase() === "planning"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-black/60 text-white border border-white/10"
                      }`}
                    >
                      {project.status || "WIP"}
                    </span>
                  </div>

                  {/* Konten card */}
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <h3
                        className="font-bold text-base text-foreground truncate cursor-pointer hover:text-green-500 transition-colors"
                        onClick={() => router.push(`/buildss/${project.id}`)}
                      >
                        {project.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {project.description || "Tidak ada deskripsi."}
                      </p>
                    </div>

                    {/* Aksi Edit & Delete */}
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => router.push(`/buildss/${project.id}/edit`)}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:border-foreground/40 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-red-500 border border-border hover:border-red-500/40 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>

                    {/* Total cost */}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        Total Cost Build:
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        IDR {getDisplayCost(project)}
                      </span>
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