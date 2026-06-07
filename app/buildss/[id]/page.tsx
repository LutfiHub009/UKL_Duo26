"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2, Calendar, Wrench, Trash2, Edit2, ArrowLeft,
  DollarSign, Plus, X, ShieldAlert, ShieldCheck, Eye,
} from "lucide-react";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/AuthGuard";

// ===========================================================
// Types
// ===========================================================
type ModificationLog = {
  id: number;
  logName?: string;
  title?: string;   // beberapa backend balikin "title" bukan "logName"
  description: string;
  cost: number;
  imageUrl?: string;
  createdAt: string;
};

type ProjectDetail = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  status: string;
  totalSpent: string;
  userId: number;
  user?: { id: number; username?: string; fullname?: string };
  modLogs?: ModificationLog[];
  tags?: string[];
};

type UserProfile = {
  id: number;
  username: string;
  fullname?: string;
  role?: string;
  roles?: string[];
};

// ===========================================================
// Helpers
// ===========================================================
function getLogTitle(log: ModificationLog) {
  return log.logName || log.title || "Untitled Log";
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params?.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<"mods" | "customer" | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Timeline form state (hanya digunakan oleh moderator)
  const [showForm, setShowForm] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCost, setFormCost] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===========================================================
  // Fetch project + timeline
  // ===========================================================
  const fetchProjectData = async (token: string) => {
    if (!projectId) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const res = await fetch(`${baseUrl}/projects/${projectId}/timeline`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Gagal mengambil data proyek.");
    const data: ProjectDetail = await res.json();
    setProject(data);
  };

  // ===========================================================
  // Init: ambil profil, cek role, lalu fetch project
  // ===========================================================
  useEffect(() => {
    const initPage = async () => {
      setIsLoading(true);
      setIsUnauthorized(false);
      setProject(null);

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = localStorage.getItem("token");

        if (!token) {
          router.push("/login");
          return;
        }

        // Ambil profil dari API agar selalu fresh
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

        if (projectId) {
          // Fetch project data
          const projectRes = await fetch(
            `${baseUrl}/projects/${projectId}/timeline`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (!projectRes.ok) throw new Error("Gagal mengambil data proyek.");

          const data: ProjectDetail = await projectRes.json();

          // Customer hanya bisa akses project miliknya
          if (role === "customer" && data.userId !== profileData.id) {
            setIsUnauthorized(true);
            return;
          }

          setProject(data);
        }
      } catch (err) {
        console.error("Init error:", err);
        toast.error("Terjadi kesalahan saat memuat halaman.");
      } finally {
        setIsLoading(false);
      }
    };

    initPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ===========================================================
  // Timeline form handlers (moderator only)
  // ===========================================================
  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormCost("");
    setFormImageUrl("");
    setEditingLogId(null);
    setShowForm(false);
  };

  const handleStartEdit = (log: ModificationLog) => {
    setEditingLogId(log.id);
    setFormTitle(getLogTitle(log));
    setFormCost(String(log.cost));
    setFormImageUrl(log.imageUrl || "");
    setFormDescription(log.description);
    setShowForm(true);
    // Scroll ke form
    setTimeout(() => {
      document.getElementById("timeline-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleSubmitTimeline = async (e: React.FormEvent) => {
    e.preventDefault();

    const nominalCost = Number(formCost) || 0;
    if (!formTitle.trim()) {
      toast.error("Title timeline tidak boleh kosong.");
      return;
    }
    if (nominalCost <= 0) {
      toast.error("Biaya modifikasi harus lebih dari 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token");

      let res;
      if (editingLogId) {
        // PUT — update existing timeline entry
        res = await fetch(`${baseUrl}/projects/timeline/${editingLogId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: formTitle,
            description: formDescription,
            cost: nominalCost,
            imageUrl: formImageUrl || undefined,
          }),
        });
      } else {
        // POST — create new timeline entry
        res = await fetch(`${baseUrl}/projects/${projectId}/timeline`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: formTitle,
            description: formDescription,
            cost: nominalCost,
            imageUrl: formImageUrl || undefined,
          }),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.message ||
            (editingLogId ? "Gagal memperbarui log." : "Gagal menyimpan log baru.")
        );
      }

      toast.success(
        editingLogId ? "Timeline berhasil diperbarui!" : "Timeline baru ditambahkan!"
      );
      resetForm();

      // Refresh data
      const tok = localStorage.getItem("token")!;
      await fetchProjectData(tok);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTimeline = async (logId: number) => {
    const confirmed = window.confirm(
      "Hapus log timeline ini secara permanen?"
    );
    if (!confirmed) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token");

      const res = await fetch(`${baseUrl}/projects/timeline/${logId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Gagal menghapus log timeline.");

      toast.success("Log timeline berhasil dihapus.");
      const tok = localStorage.getItem("token")!;
      await fetchProjectData(tok);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // ===========================================================
  // Derived helpers
  // ===========================================================
  const isMods = userRole === "mods";
  const displayCost =
    project?.totalSpent && project.totalSpent !== "0"
      ? Number(project.totalSpent).toLocaleString("id-ID")
      : "0";

  const getRequesterName = () => {
    if (!project) return "";
    if (project.user?.username) return project.user.username;
    if (project.user?.fullname) return project.user.fullname;
    return `User #${project.userId}`;
  };

  // ===========================================================
  // Render: Loading
  // ===========================================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-green-500" size={40} />
          <p className="text-sm text-muted-foreground">Memuat detail project...</p>
        </div>
      </div>
    );
  }

  // ===========================================================
  // Render: Unauthorized (customer mencoba akses project orang lain)
  // ===========================================================
  if (isUnauthorized) {
    return (
      <AuthGuard>
        <div className="flex flex-col md:flex-row bg-background text-foreground min-h-screen font-sans">
          <Sidebar activePage="builds" />
          <main className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
            <div className="bg-card border border-red-500/20 rounded-2xl p-10 flex flex-col items-center gap-4 max-w-md text-center shadow-sm">
              <ShieldAlert className="text-red-500" size={48} />
              <h2 className="text-xl font-bold text-foreground">Akses Ditolak</h2>
              <p className="text-sm text-muted-foreground">
                Project ini bukan milik akun Anda. Anda tidak diizinkan mengakses
                data project orang lain.
              </p>
              <button
                onClick={() => router.push("/buildss")}
                className="mt-2 bg-green-500 hover:bg-green-600 text-black text-sm font-bold px-6 py-2.5 rounded-xl transition-colors"
              >
                Kembali ke My Builds
              </button>
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  // ===========================================================
  // Render: Main Page
  // ===========================================================
  return (
    <AuthGuard>
      <Toaster position="top-right" richColors />
      <div className="flex flex-col md:flex-row bg-background text-foreground min-h-screen font-sans">
        <Sidebar activePage="builds" />

        <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full overflow-y-auto">

          {/* Back Button */}
          <button
            onClick={() => router.push("/buildss")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            {isMods ? "Kembali ke All Builds" : "Kembali ke My Builds"}
          </button>

          {/* ==================== PROJECT BANNER ==================== */}
          {project && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-6">
              <div className="relative h-64 w-full bg-muted">
                <img
                  src={
                    project.imageUrl ||
                    "https://images.unsplash.com/photo-1503376780353-7e6692767b70"
                  }
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-6">
                  <div className="w-full">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="bg-green-500 text-black text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {project.status || "WIP"}
                      </span>
                      {/* Moderator: tampilkan "requested by" di banner */}
                      {isMods && (
                        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-md">
                          Requested by{" "}
                          <span className="font-bold text-blue-200">
                            {getRequesterName()}
                          </span>
                        </span>
                      )}
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">
                      {project.title}
                    </h1>
                    <p className="text-gray-300 text-sm mt-1 max-w-2xl">
                      {project.description}
                    </p>
                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.tags.map((t) => (
                          <span key={t} className="bg-muted/80 text-sm text-foreground px-3 py-1 rounded-full border border-border">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Edit tags quick link for mods and owner */}
                    {(isMods || project.userId === currentUser?.id) && (
                      <div className="mt-3">
                        <Link href={`/buildss/${project.id}/edit`} className="text-xs bg-green-500 text-black font-semibold px-3 py-1 rounded-xl hover:bg-green-600">
                          Edit Tags
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-muted/30 border-t border-border flex justify-between items-center px-6">
                <span className="text-xs text-muted-foreground font-medium">
                  Total Project Investment:
                </span>
                <span className="text-lg font-bold text-green-500">
                  IDR {displayCost}
                </span>
              </div>
            </div>
          )}

          {/* ==================== TIMELINE HEADER ==================== */}
          <div
            id="timeline-form"
            className="flex items-center justify-between mb-5"
          >
            <div>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                {isMods ? (
                  <>
                    <ShieldCheck size={18} className="text-blue-400" />
                    Manage Build Timeline
                  </>
                ) : (
                  <>
                    <Eye size={18} className="text-green-500" />
                    Build Progress Timeline
                  </>
                )}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isMods
                  ? "Tambah atau edit log pengerjaan build sebagai moderator"
                  : "Lihat progress pengerjaan kendaraan Anda"}
              </p>
            </div>

            {/* Moderator: tombol tambah timeline */}
            {isMods && (
              <button
                onClick={() => {
                  if (showForm) resetForm();
                  else setShowForm(true);
                }}
                className={`text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm ${
                  showForm
                    ? "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                    : "bg-green-500 hover:bg-green-600 text-black"
                }`}
              >
                {showForm ? <X size={15} /> : <Plus size={15} />}
                {showForm ? "Batal" : "Tambah Timeline"}
              </button>
            )}
          </div>

          {/* ==================== TIMELINE FORM (MODERATOR ONLY) ==================== */}
          {isMods && showForm && (
            <form
              onSubmit={handleSubmitTimeline}
              className="bg-card border border-green-500/20 rounded-2xl p-6 mb-8 space-y-4 shadow-sm animate-in fade-in-50 duration-200"
            >
              <h3 className="text-sm font-bold border-b border-border pb-2 text-green-500">
                {editingLogId
                  ? "📝 Edit Timeline Log"
                  : "🛠️ Tambah Timeline Baru"}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Judul Aktivitas Modifikasi *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Contoh: Pasang Turbocharger Stage 2"
                    className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-green-500/60"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Biaya Part & Jasa (IDR) *
                  </label>
                  <input
                    type="number"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    placeholder="Contoh: 2500000"
                    className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-green-500/60"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  URL Foto Dokumentasi (opsional)
                </label>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://example.com/foto-modifikasi.jpg"
                  className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-green-500/60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Catatan Detail / Spesifikasi Part *
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Tulis rincian spesifikasi part yang dipasang..."
                  className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-green-500/60"
                  required
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-500 text-black text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-green-600 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : editingLogId ? (
                    "Update Timeline"
                  ) : (
                    "Simpan Timeline"
                  )}
                </button>
                {editingLogId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="border border-border bg-transparent text-xs font-medium px-4 py-2.5 rounded-xl hover:bg-muted transition-colors"
                  >
                    Batal Edit
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ==================== TIMELINE LIST ==================== */}
          <div className="relative border-l-2 border-border ml-4 pl-6 space-y-8 py-2">
            {project?.modLogs && project.modLogs.length > 0 ? (
              project.modLogs.map((log) => (
                <div key={log.id} className="relative group">
                  {/* Timeline node */}
                  <div
                    className={`absolute -left-[31px] top-1 rounded-full p-1.5 transition-colors ${
                      isMods
                        ? "bg-background border-2 border-blue-500 text-blue-500 group-hover:bg-blue-500 group-hover:text-white"
                        : "bg-background border-2 border-green-500 text-green-500 group-hover:bg-green-500 group-hover:text-black"
                    }`}
                  >
                    <Wrench size={12} />
                  </div>

                  {/* Log card */}
                  <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-neutral-700 transition-colors flex flex-col md:flex-row gap-5 justify-between">
                    <div className="flex-1">
                      {/* Title + cost */}
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="font-bold text-base tracking-tight text-foreground">
                          {getLogTitle(log)}
                        </h3>
                        <span className="bg-green-500/10 text-green-400 text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-0.5">
                          <DollarSign size={10} /> IDR{" "}
                          {Number(log.cost)?.toLocaleString("id-ID")}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mb-3">
                        <Calendar size={12} />
                        {new Date(log.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>

                      {/* Description */}
                      <p className="text-muted-foreground text-xs leading-relaxed max-w-2xl">
                        {log.description}
                      </p>
                    </div>

                    {/* Photo */}
                    {log.imageUrl && (
                      <div className="w-full md:w-32 h-24 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                        <img
                          src={log.imageUrl}
                          alt={getLogTitle(log)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Action buttons (moderator only) */}
                    {isMods && (
                      <div className="md:self-start flex md:flex-col gap-1 justify-end">
                        <button
                          onClick={() => handleStartEdit(log)}
                          className="text-muted-foreground hover:text-green-500 p-1.5 rounded-lg hover:bg-green-500/10 transition-colors"
                          title="Edit Log"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteTimeline(log.id)}
                          className="text-muted-foreground hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Delete Log"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-12 text-center gap-2">
                <Wrench size={32} className="text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground font-medium">
                  {isMods
                    ? "Belum ada timeline yang ditambahkan untuk project ini."
                    : "Belum ada progress build yang tercatat."}
                </p>
                {isMods && (
                  <p className="text-xs text-muted-foreground/70">
                    Klik &ldquo;Tambah Timeline&rdquo; di atas untuk memulai tracking.
                  </p>
                )}
                {!isMods && (
                  <p className="text-xs text-muted-foreground/70">
                    Moderator akan menambahkan progress build Anda di sini.
                  </p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}