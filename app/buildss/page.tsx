"use client";

import { useMemo, useState, useEffect } from "react"; // Tambahkan useEffect
import { Plus, Search, Loader2 } from "lucide-react"; // Tambahkan Loader2 untuk spinner
import { toast, Toaster } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/AuthGuard";
import Link from "next/link";

// Sesuaikan tipe Project dengan struktur asli dari response Swagger Anda
type Project = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  status: "Complete" | "WIP" | "Planning";
  progress: number;
  totalSpent: string;
  userId: number;
  tags: string[];
};

// Kita jadikan FILTER_TAGS ini dinamis atau default sementara
const FILTER_TAGS = ["Toyota", "Avanza", "Sleeper", "WIP"];

const getStatusBadgeStyle = (status: Project["status"]) => {
  switch (status) {
    case "Complete":
      return "bg-green-500 text-black font-semibold border-transparent";
    case "WIP":
      return "bg-muted/90 text-foreground backdrop-blur-sm border-transparent";
    case "Planning":
      return "bg-muted/20 text-muted-foreground border border-border backdrop-blur-md";
    default:
      return "bg-muted text-foreground";
  }
};

export default function MyBuildsPage() {
  // 1. State untuk menampung data asli dari backend (Awalnya kosong [])
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // 2. Fungsi GET untuk menarik data dari API backend
  // Gabungkan fetchProjects langsung di dalam useEffect
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      setErrorMsg("");
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = localStorage.getItem("token");

        const res = await fetch(`${baseUrl}/projects`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch projects (HTTP ${res.status})`);
        }

        const data = await res.json();
        setProjects(data);

      } catch (err: unknown) {
        console.error(err);
        const errorMessage = (err as Error).message || "Gagal memuat data proyek.";
        setErrorMsg(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    // Panggil fungsinya
    fetchProjects();
  }, []); 

  // Filter projects berdasarkan input pencarian
  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          project.title.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query);

        // Pengecekan tag (jika array tags dari backend tidak kosong)
        const matchesTag = activeTag ? project.tags?.includes(activeTag) : true;

        return matchesSearch && matchesTag;
      }),
    [projects, searchQuery, activeTag],
  );

  // Fungsi untuk menghapus project berdasarkan ID
  const handleDelete = async (id: number) => {
    // Berikan konfirmasi ke user sebelum benar-benar menghapus
    const confirmDelete = window.confirm(
      "Apakah Anda yakin ingin menghapus project ini?",
    );
    if (!confirmDelete) {
      toast.error("Delete cancelled");
      return;
    }

    // Gunakan toast.promise untuk menampilkan loading, success, dan error states
    toast.promise(
      (async () => {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = localStorage.getItem("token");

        if (!token) throw new Error("Sesi habis, silakan login kembali.");

        // Menembak endpoint DELETE /projects/{id}
        const res = await fetch(`${baseUrl}/projects/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Gagal menghapus project (HTTP ${res.status})`);
        }

        // SINKRONISASI UI LOKAL: Hapus data dari state secara realtime tanpa perlu reload halaman
        setProjects((prev) => prev.filter((project) => project.id !== id));
      })(),
      {
        loading: "Sedang menghapus project...",
        success: "Project berhasil dihapus!",
        error: (err) => {
          const errorMessage = (err as Error).message || "Terjadi kesalahan saat menghapus data.";
          return errorMessage;
        },
      }
    );
  };
  return (
    <AuthGuard>
      <Toaster position="top-right" richColors />
      <div className="max-w-7xl mx-auto pb-10 flex flex-col md:flex-row gap-6">
        <Sidebar activePage="builds" />

        <main className="flex-1">
          {/* Header */}
          <div className="flex flex-col gap-6 md:items-start md:flex-row md:justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 text-foreground">
                All Builds
              </h2>
              <p className="text-muted-foreground">
                Explore projects from the community
              </p>
            </div>

            <Link
              href="/buildss/new"
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              New Project
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-full mb-6">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
              placeholder="Search by title or description..."
              className="w-full bg-input border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          {/* Filter Tags */}
          <div className="mb-8">
            <p className="text-muted-foreground mb-3 text-sm">
              Filter by tags:
            </p>
            <div className="flex flex-wrap gap-2">
              {FILTER_TAGS.map((tag) => {
                const isActive = activeTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(isActive ? null : tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      isActive
                        ? "bg-green-500 text-black"
                        : "bg-popover border border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kondisi Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="animate-spin text-green-500" size={32} />
              <p className="text-sm text-muted-foreground">
                Loading builds from database...
              </p>
            </div>
          )}

          {/* Kondisi Error */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm mb-6">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Kondisi jika Data Kosong di Database */}
          {!isLoading && filteredProjects.length === 0 && (
            <div className="text-center py-20 border border-dashed border-border rounded-2xl">
              <p className="text-muted-foreground text-sm">
                No build projects found. Create a new one!
              </p>
            </div>
          )}

          {/* List Projects Grid Asli Backend */}
          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col hover:border-primary/50 transition-colors"
                >
                  <div className="relative h-48 w-full bg-card/80">
                    <img
                      src={
                        project.imageUrl ||
                        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800"
                      }
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className={`absolute top-4 right-4 px-3 py-1 text-xs rounded-full ${getStatusBadgeStyle(project.status)}`}
                    >
                      {project.status || "WIP"}
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-[17px] text-card-foreground mb-1 leading-tight">
                      {project.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <Link
                        href={`/buildss/${project.id}/edit`}
                        className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors inline-block"
                      >
                        ✏️ Edit Project
                      </Link>

                      <button
                        onClick={() => handleDelete(project.id)}
                        className="text-xs bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-3 py-1.5 rounded-md font-medium transition-all"
                      >
                        🗑️ Delete
                      </button>
                    </div>

                    <div className="flex justify-between items-center mb-5 text-sm mt-auto pt-2 border-t border-border/50">
                      <span className="text-muted-foreground">Total Cost:</span>
                      <span className="font-bold text-card-foreground text-[15px]">
                        {project.totalSpent === "0"
                          ? "IDR 0"
                          : project.totalSpent}
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
