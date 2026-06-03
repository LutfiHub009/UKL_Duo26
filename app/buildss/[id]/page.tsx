"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Plus, Calendar, Wrench, Trash2, ArrowLeft, DollarSign } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/AuthGuard";

// 1. Sesuaikan tipe dengan properti asli backend (modLogs)
type ModificationLog = {
  id: number;
  title: string;
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
  totalSpent: string; // Sesuai JSON backend Anda yang bertipe string
  userId: number;
  modLogs?: ModificationLog[]; // Menggunakan nama variabel asli dari backend Anda
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // State Form Input untuk POST /projects/{id}/timeline
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fungsi memuat detail data proyek & modLogs sekaligus
  const fetchProjectData = async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token");

      // Menembak data spesifik proyek
      const res = await fetch(`${baseUrl}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Gagal mengambil rincian data proyek.");
      const data = await res.json();
      setProject(data);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
  const loadData = async () => {
    if (projectId) {
      await fetchProjectData();
    }
  };
  
  loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [projectId]);

  // Eksekusi POST /projects/{id}/timeline
  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token");

      const res = await fetch(`${baseUrl}/projects/${projectId}/timeline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          cost: Number(cost) || 0,
          imageUrl: imageUrl || undefined,
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan update modifikasi baru.");

      toast.success("Log modifikasi berhasil disuntikkan ke lini masa!");
      
      // Reset input form
      setTitle("");
      setDescription("");
      setCost("");
      setImageUrl("");
      setShowForm(false);
      
      // Ambil data ulang dari server agar totalSpent & modLogs terupdate secara realtime
      fetchProjectData(); 
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eksekusi DELETE /projects/timeline/{logId}
  const handleDeleteTimeline = async (logId: number) => {
    const confirm = window.confirm("Hapus log pengerjaan part ini dari timeline?");
    if (!confirm) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token");

      const res = await fetch(`${baseUrl}/projects/timeline/${logId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Gagal menghapus log timeline.");

      toast.success("Log pengerjaan dihapus.");
      fetchProjectData(); 
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin text-green-500" size={40} />
      </div>
    );
  }

  // Format pengeluaran dari string totalSpent backend
  const displayCost = project?.totalSpent && project.totalSpent !== "0"
    ? Number(project.totalSpent).toLocaleString("id-ID")
    : "0";

  return (
    <AuthGuard>
      <Toaster position="top-right" richColors />
      <div className="flex flex-col md:flex-row bg-background text-foreground min-h-screen font-sans">
        <Sidebar activePage="builds" />

        <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full overflow-y-auto">
          {/* Tombol Kembali */}
          <button onClick={() => router.push("/buildss")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Project List
          </button>

          {/* Banner Profil Utama Kendaraan */}
          {project && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-8">
              <div className="relative h-64 w-full bg-muted">
                <img src={project.imageUrl || "https://images.unsplash.com/photo-1503376780353-7e6692767b70"} alt={project.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-6">
                  <div>
                    <span className="bg-green-500 text-black text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider mb-2 inline-block">
                      {project.status || "WIP"}
                    </span>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">{project.title}</h1>
                    <p className="text-gray-300 text-sm mt-1 max-w-2xl">{project.description}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-muted/30 border-t border-border flex justify-between items-center px-6">
                <span className="text-xs text-muted-foreground font-medium">Total Project Investment:</span>
                <span className="text-lg font-bold text-green-500">IDR {displayCost}</span>
              </div>
            </div>
          )}

          {/* Bagian Manajemen Judul Timeline */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Build Progress Timeline</h2>
              <p className="text-xs text-muted-foreground">Historical blueprint logs from modLogs array</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-500 hover:bg-green-600 text-black text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus size={16} /> {showForm ? "Close Sheet" : "Add New Timeline"}
            </button>
          </div>

          {/* Form Create: POST /projects/{id}/timeline */}
          {showForm && (
            <form onSubmit={handleAddTimeline} className="bg-card border border-green-500/20 rounded-2xl p-6 mb-8 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold border-b border-border pb-2 text-green-500">🛠️ Write New Performance Log</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Modification Activity Title *</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Upgrade Turbo Header Kit" className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Part & Labor Cost (IDR) *</label>
                  <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Contoh: 1500000" className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Snapshot Documentation Image Link URL</label>
                <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://domain.com/foto-mesin.jpg" className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Detailed Blueprint Specs / Part Notes *</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tulis rincian spesifikasi part baru yang terpasang di sini..." className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" required />
              </div>
              <button type="submit" disabled={isSubmitting} className="bg-green-500 text-black text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-green-600 flex items-center gap-2 transition-all disabled:opacity-50">
                {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : "Save to Timeline"}
              </button>
            </form>
          )}

          {/* RENDER TREE VERTIKAL MODIFICATION LOGS */}
          <div className="relative border-l-2 border-border ml-4 pl-6 space-y-8 py-2">
            {project?.modLogs && project.modLogs.length > 0 ? (
              project.modLogs.map((log) => (
                <div key={log.id} className="relative group">
                  {/* Bulatan Node Jalur */}
                  <div className="absolute -left-[33px] top-1 bg-background border-2 border-green-500 rounded-full p-1.5 text-green-500 group-hover:bg-green-500 group-hover:text-black transition-colors">
                    <Wrench size={12} />
                  </div>

                  {/* Konten Utama Log Modifikasi */}
                  <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-neutral-800 transition-colors flex flex-col md:flex-row gap-5 justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="font-bold text-base tracking-tight text-foreground">{log.title}</h3>
                        <span className="bg-green-500/10 text-green-400 text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-0.5">
                          <DollarSign size={10} /> IDR {log.cost?.toLocaleString("id-ID")}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mb-3">
                        <Calendar size={12} />
                        {new Date(log.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      
                      <p className="text-muted-foreground text-xs leading-relaxed max-w-2xl">{log.description}</p>
                    </div>

                    {log.imageUrl && (
                      <div className="w-full md:w-32 h-24 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                        <img src={log.imageUrl} alt={log.title} className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="md:self-start flex justify-end">
                      <button onClick={() => handleDeleteTimeline(log.id)} className="text-muted-foreground hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground italic pl-2">
                Belum ada rekaman lini masa modifikasi pada kendaraan ini. Tekan tombol kanan atas untuk mulai mengisinya!
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}