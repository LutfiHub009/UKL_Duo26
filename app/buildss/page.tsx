"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Search,
  Loader2,
  Trash2,
  Edit3,
  FolderKanban,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/AuthGuard";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import Image from "next/image";

type Project = {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  status?: string;
  progress?: number | string;
  totalCost?: number | string;
  cost?: number | string;
  totalSpent?: number | string;
  userId: number;
};

type UserProfile = {
  id: number;
  username: string;
};

const FILTER_STATUSES = ["All", "WIP", "Complete", "Planning"];

const getStatusBadgeStyle = (status: string) => {
  const normStatus = status?.toLowerCase() || "wip";
  switch (normStatus) {
    case "complete":
      return "bg-green-500 text-black font-bold border-transparent";
    case "planning":
      return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    case "wip":
    default:
      return "bg-neutral-800 text-white border border-neutral-700";
  }
};

export default function MyBuildsPage() {
  const router = useRouter(); 

  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("All");

  useEffect(() => {
    const fetchAllBuildsAndUser = async () => {
      setIsLoading(true);
      setErrorMsg("");
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = localStorage.getItem("token");

        const [profileRes, projectsRes] = await Promise.all([
          fetch(`${baseUrl}/auth/profile`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${baseUrl}/projects`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setCurrentProfile(profileData);
        }

        if (!projectsRes.ok) {
          throw new Error(
            `Gagal memuat list proyek (HTTP ${projectsRes.status})`,
          );
        }

        const projectsData = await projectsRes.json();
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      } catch (err: unknown) {
        console.error(err);
        const errorMessage = (err as Error).message || "Koneksi ke database gagal.";
        setErrorMsg(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllBuildsAndUser();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        project.title.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query);

      const matchesStatus =
        activeStatusFilter === "All" ||
        project.status?.toLowerCase() === activeStatusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, activeStatusFilter]);

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm(
      "Apakah Anda yakin ingin menghapus proyek bangun kendaraan ini?",
    );
    if (!confirmDelete) return;

    toast.promise(
      (async () => {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = localStorage.getItem("token");

        if (!token) throw new Error("Sesi habis, silakan login kembali.");

        const res = await fetch(`${baseUrl}/projects/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Gagal menghapus proyek (HTTP ${res.status})`);
        }

        setProjects((prev) => prev.filter((project) => project.id !== id));
      })(),
      {
        loading: "Menghapus data proyek...",
        success: "Proyek berhasil dihapus dari sistem!",
        error: (err) => (err as Error).message || "Terjadi kesalahan sistem.",
      },
    );
  };

  return (
    <AuthGuard>
      <Toaster position="top-right" richColors />
      <div className="flex flex-col md:flex-row bg-background text-foreground transition-all duration-300 font-sans min-h-screen overflow-hidden">
        <Sidebar activePage="builds" />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1">All Builds</h1>
              <p className="text-sm text-muted-foreground">
                Explore real custom build vehicle mechanics from the community
              </p>
            </div>

            <Link
              href="/buildss/new"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-sm"
            >
              <Plus size={18} />
              New Project
            </Link>
          </div>

          <div className="relative w-full mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
              placeholder="Search builds by title or component description..."
              className="w-full bg-input border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="mb-8">
            <p className="text-muted-foreground mb-2.5 text-xs font-medium uppercase tracking-wider">
              Filter by build status:
            </p>
            <div className="flex flex-wrap gap-2">
              {FILTER_STATUSES.map((status) => {
                const isActive = activeStatusFilter === status;
                return (
                  <button
                    key={status}
                    onClick={() => setActiveStatusFilter(status)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      isActive
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-card border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-32 gap-2">
              <Loader2 className="animate-spin text-primary" size={36} />
              <p className="text-sm text-muted-foreground">
                Syncing global builds repository...
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm mb-6">
              {errorMsg}
            </div>
          )}

          {!isLoading && filteredProjects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-2xl bg-card text-muted-foreground text-center p-6 gap-2">
              <FolderKanban size={36} className="text-gray-500" />
              <p className="text-sm font-medium">No custom projects matching parameters</p>
              <p className="text-xs text-gray-500">
                Be the first mechanic to document a build profile!
              </p>
            </div>
          )}

          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => {
                const rawCost = project.totalSpent || "0";
                const formattedCost = Number(rawCost).toLocaleString("id-ID");
                const isOwner = currentProfile && project.userId === currentProfile.id;

                return (
                  <div
                    key={project.id}
                    onClick={() => router.push(`/buildss/${project.id}`)}
                    className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-green-500/40 transition-all group text-card-foreground cursor-pointer"
                  >
                    <div>
                      <div className="relative h-48 w-full bg-muted overflow-hidden">
                        <Image
                          src={project.imageUrl || "https://images.unsplash.com/photo-1503376780353-7e6692767b70"}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          fill
                          unoptimized
                        />
                        <div className={`absolute top-3 right-3 px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md ${getStatusBadgeStyle(project.status || "WIP")}`}>
                          {project.status || "WIP"}
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-base text-foreground truncate mb-1 group-hover:text-green-500 transition-colors">
                          {project.title || "Untitled Build"}
                        </h3>
                        <p className="text-muted-foreground text-xs min-h-9 line-clamp-2 leading-relaxed mb-4">
                          {project.description || "No project overview description provided."}
                        </p>

                        {isOwner ? (
                          <div className="flex items-center gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/buildss/${project.id}/edit`}
                              className="text-[11px] bg-secondary hover:bg-secondary/80 border border-border text-foreground px-2.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1"
                            >
                              <Edit3 size={12} />
                              Edit
                            </Link>

                            <button
                              onClick={() => handleDelete(project.id)}
                              className="text-[11px] bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-2.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          </div>
                        ) : (
                          <div className="text-[11px] text-muted-foreground italic mb-2 bg-muted/50 px-2 py-1 rounded w-max">
                            🔒 View Only Profile
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <div className="flex justify-between items-center text-xs pt-3.5 border-t border-border/60">
                        <span className="text-muted-foreground">Total Cost Build:</span>
                        <span className="font-bold text-foreground text-sm">
                          IDR {formattedCost}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}