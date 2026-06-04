// "use client";

// import { useState, useEffect } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { Loader2, Calendar, Wrench, Trash2, Edit2, ArrowLeft, DollarSign, Plus, X } from "lucide-react";
// import { toast, Toaster } from "sonner";
// import { Sidebar } from "@/components/sidebar";
// import { AuthGuard } from "@/components/AuthGuard";

// type ModificationLog = {
//   id: number;
//   logName: string;
//   description: string;
//   cost: number;
//   imageUrl?: string;
//   createdAt: string;
// };

// type ProjectDetail = {
//   id: number;
//   title: string;
//   description: string;
//   imageUrl: string;
//   status: string;
//   totalSpent: string; 
//   userId: number;
//   modLogs?: ModificationLog[];
// };

// export default function ProjectDetailPage() {
//   const params = useParams();
//   const router = useRouter();
  
//   // Memastikan projectId murni berupa string id tanpa embel-embel port atau rerender leak
//   const projectId = params?.id;

//   const [project, setProject] = useState<ProjectDetail | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [showForm, setShowForm] = useState(false);
//   const [editingLogId, setEditingLogId] = useState<number | null>(null);

//   const [userProfile, setUserProfile] = useState<{ id: number; username: string } | null>(null);

//   // State Form Input
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [cost, setCost] = useState("");
//   const [imageUrl, setImageUrl] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Ambil rincian data proyek beserta linimasa sesuai image_6beb84.png
//   const fetchProjectData = async () => {
//     if (!projectId) return;
//     try {
//       const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
//       const token = localStorage.getItem("token");

//       const res = await fetch(`${baseUrl}/projects/${projectId}/timeline`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!res.ok) throw new Error("Gagal mengambil data lini masa proyek.");
      
//       const data = await res.json();
//       setProject(data);
//     } catch (err) {
//       toast.error((err as Error).message);
//     }
//   };

//   // FIX: Lifecycle disatukan dalam satu alur sequensial asinkronus agar bebas dari Error State Synchronously
//   useEffect(() => {
//     const initPage = async () => {
//       setIsLoading(true);

//       // Ambil data user profile lokal
//       const savedUser = localStorage.getItem("user") || localStorage.getItem("profile");
//       if (savedUser) {
//         try {
//           setUserProfile(JSON.parse(savedUser));
//         } catch (e) {
//           console.error("Gagal membaca profil pengguna", e);
//         }
//       }

//       // Ambil data API jika parameter id valid
//       if (projectId) {
//         await fetchProjectData();
//       }
      
//       setIsLoading(false);
//     };

//     initPage();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [projectId]);

//   // Handler untuk mengaktifkan mode Edit
//   const handleStartEdit = (log: ModificationLog) => {
//     setEditingLogId(log.id);
//     setTitle(log.logName);
//     setCost(log.cost.toString());
//     setImageUrl(log.imageUrl || "");
//     setDescription(log.description);
//     setShowForm(true);
//   };

//   // Handler untuk mereset isi form input
//   const resetForm = () => {
//     setTitle("");
//     setDescription("");
//     setCost("");
//     setImageUrl("");
//     setEditingLogId(null);
//     setShowForm(false);
//   };

//   // Submit Handler: Menangani POST (Tambah) dan PUT (Edit sesuai image_6bdfa6.png)
//   const handleSubmitTimeline = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     const nominalCost = Number(cost) || 0;
//     if (nominalCost <= 0) {
//       toast.error("Biaya modifikasi harus lebih besar dari 0.");
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
//       const token = localStorage.getItem("token");

//       let res;
//       if (editingLogId) {
//         // PERBAIKAN PUT: Menggunakan properti "title" sesuai dengan schema backend di image_6bdfa6.png
//         const payloadPut = {
//           title,
//           description,
//           cost: nominalCost,
//           imageUrl: imageUrl || undefined,
//         };

//         res = await fetch(`${baseUrl}/projects/timeline/${editingLogId}`, {
//           method: "PUT",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify(payloadPut),
//         });
//       } else {
//         // PERBAIKAN POST: Menggunakan properti "logName" sesuai dengan mapping data response dari backend di image_6b7a6a.png
//         const payloadPost = {
//           logName: title, 
//           description,
//           cost: nominalCost,
//           imageUrl: imageUrl || undefined,
//         };

//         res = await fetch(`${baseUrl}/projects/${projectId}/timeline`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify(payloadPost),
//         });
//       }

//       // Validasi Response & Menangkap Pesan Error Wallet / Saldo dari Server
//       if (!res.ok) {
//         const errorData = await res.json().catch(() => ({}));
//         throw new Error(
//           errorData.message || 
//           (editingLogId ? "Gagal memperbarui log." : "Gagal menyimpan log baru. Periksa kembali dana wallet Anda.")
//         );
//       }

//       toast.success(editingLogId ? "Log modifikasi berhasil diperbarui!" : "Log modifikasi baru ditambahkan!");
//       resetForm();
//       await fetchProjectData(); 
//     } catch (err) {
//       toast.error((err as Error).message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Eksekusi DELETE /projects/timeline/{logId}
//   const handleDeleteTimeline = async (logId: number) => {
//     const confirm = window.confirm("Hapus log pengerjaan part ini dari timeline?");
//     if (!confirm) return;

//     try {
//       const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
//       const token = localStorage.getItem("token");

//       const res = await fetch(`${baseUrl}/projects/timeline/${logId}`, {
//         method: "DELETE",
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!res.ok) throw new Error("Gagal menghapus log timeline.");

//       toast.success("Log pengerjaan berhasil dihapus.");
//       await fetchProjectData(); 
//     } catch (err) {
//       toast.error((err as Error).message);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-background">
//         <Loader2 className="animate-spin text-green-500" size={40} />
//       </div>
//     );
//   }

//   const displayCost = project?.totalSpent && project.totalSpent !== "0"
//     ? Number(project.totalSpent).toLocaleString("id-ID")
//     : "0";

//   return (
//     <AuthGuard>
//       <Toaster position="top-right" richColors />
//       <div className="flex flex-col md:flex-row bg-background text-foreground min-h-screen font-sans">
//         <Sidebar activePage="builds" />

//         <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full overflow-y-auto">
//           {/* Tombol Kembali */}
//           <button onClick={() => router.push("/buildss")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
//             <ArrowLeft size={16} /> Back to Project List
//           </button>

//           {/* Banner Profil Utama Proyek */}
//           {project && (
//             <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-8">
//               <div className="relative h-64 w-full bg-muted">
//                 <img src={project.imageUrl || "https://images.unsplash.com/photo-1503376780353-7e6692767b70"} alt={project.title} className="w-full h-full object-cover" />
//                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-6">
//                   <div>
//                     <span className="bg-green-500 text-black text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider mb-2 inline-block">
//                       {project.status || "WIP"}
//                     </span>
//                     <h1 className="text-3xl font-extrabold text-white tracking-tight">{project.title}</h1>
//                     <p className="text-gray-300 text-sm mt-1 max-w-2xl">{project.description}</p>
//                   </div>
//                 </div>
//               </div>
//               <div className="p-4 bg-muted/30 border-t border-border flex justify-between items-center px-6">
//                 <span className="text-xs text-muted-foreground font-medium">Total Project Investment:</span>
//                 <span className="text-lg font-bold text-green-500">IDR {displayCost}</span>
//               </div>
//             </div>
//           )}

//           {/* Bagian Manajemen Judul Timeline */}
//           <div className="flex items-center justify-between mb-6">
//             <div>
//               <h2 className="text-xl font-bold tracking-tight">Build Progress Timeline</h2>
//               <p className="text-xs text-muted-foreground">Historical blueprint logs from modLogs array</p>
//             </div>
            
//             <button
//               onClick={() => {
//                 if (showForm) resetForm();
//                 else setShowForm(true);
//               }}
//               className="bg-green-500 hover:bg-green-600 text-black text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
//             >
//               {showForm ? <X size={16} /> : <Plus size={16} />} 
//               {showForm ? "Cancel Operation" : "Add New Timeline"}
//             </button>
//           </div>

//           {/* Form Create / Update Sheet */}
//           {showForm && (
//             <form onSubmit={handleSubmitTimeline} className="bg-card border border-green-500/20 rounded-2xl p-6 mb-8 space-y-4 shadow-sm">
//               <h3 className="text-sm font-bold border-b border-border pb-2 text-green-500">
//                 {editingLogId ? "📝 Edit Existing Performance Log" : "🛠️ Write New Performance Log"}
//               </h3>
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div className="space-y-1">
//                   <label className="text-xs font-medium text-muted-foreground">Modification Activity Title *</label>
//                   <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Upgrade Turbo Header Kit" className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" required />
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-xs font-medium text-muted-foreground">Part & Labor Cost (IDR) *</label>
//                   <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Contoh: 1500000" className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" required />
//                 </div>
//               </div>
//               <div className="space-y-1">
//                 <label className="text-xs font-medium text-muted-foreground">Snapshot Documentation Image Link URL</label>
//                 <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://domain.com/foto-mesin.jpg" className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" />
//               </div>
//               <div className="space-y-1">
//                 <label className="text-xs font-medium text-muted-foreground">Detailed Blueprint Specs / Part Notes *</label>
//                 <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tulis rincian spesifikasi part baru..." className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" required />
//               </div>
//               <div className="flex gap-2 pt-2">
//                 <button type="submit" disabled={isSubmitting} className="bg-green-500 text-black text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-green-600 flex items-center gap-2 transition-all disabled:opacity-50">
//                   {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : editingLogId ? "Update Log" : "Save to Timeline"}
//                 </button>
//                 {editingLogId && (
//                   <button type="button" onClick={resetForm} className="border border-border bg-transparent text-xs font-medium px-4 py-2.5 rounded-xl hover:bg-muted transition-colors">
//                     Cancel
//                   </button>
//                 )}
//               </div>
//             </form>
//           )}

//           {/* Render Jalur Vertikal Linimasa */}
//           <div className="relative border-l-2 border-border ml-4 pl-6 space-y-8 py-2">
//             {project?.modLogs && project.modLogs.length > 0 ? (
//               project.modLogs.map((log) => (
//                 <div key={log.id} className="relative group">
//                   {/* Bulatan Node Jalur */}
//                   <div className="absolute -left-[31px] top-1 bg-background border-2 border-green-500 rounded-full p-1.5 text-green-500 group-hover:bg-green-500 group-hover:text-black transition-colors">
//                     <Wrench size={12} />
//                   </div>

//                   {/* Konten Log */}
//                   <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-neutral-800 transition-colors flex flex-col md:flex-row gap-5 justify-between">
//                     <div className="flex-1">
//                       <div className="flex flex-wrap items-center gap-2 mb-1.5">
//                         <h3 className="font-bold text-base tracking-tight text-foreground">{log.logName}</h3>
//                         <span className="bg-green-500/10 text-green-400 text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-0.5">
//                           <DollarSign size={10} /> IDR {Number(log.cost)?.toLocaleString("id-ID")}
//                         </span>
//                       </div>
                      
//                       <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mb-3">
//                         <Calendar size={12} />
//                         {new Date(log.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
//                       </div>
                      
//                       <p className="text-muted-foreground text-xs leading-relaxed max-w-2xl">{log.description}</p>
//                     </div>

//                     {log.imageUrl && (
//                       <div className="w-full md:w-32 h-24 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
//                         <img src={log.imageUrl} alt={log.logName} className="w-full h-full object-cover" />
//                       </div>
//                     )}

//                     {/* Tombol Aksi */}
//                     <div className="md:self-start flex md:flex-col gap-1 justify-end">
//                       <button onClick={() => handleStartEdit(log)} className="text-muted-foreground hover:text-green-500 p-1.5 rounded-lg hover:bg-green-500/10 transition-colors" title="Edit Log">
//                         <Edit2 size={14} />
//                       </button>
//                       <button onClick={() => handleDeleteTimeline(log.id)} className="text-muted-foreground hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" title="Delete Log">
//                         <Trash2 size={14} />
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <div className="text-sm text-muted-foreground italic pl-2">
//                 Belum ada rekaman lini masa modifikasi pada kendaraan ini.
//               </div>
//             )}
//           </div>
//         </main>
//       </div>
//     </AuthGuard>
//   );
// }



"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Calendar, Wrench, Trash2, Edit2, ArrowLeft, DollarSign, Plus, X, ShieldAlert } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/AuthGuard";

type ModificationLog = {
  id: number;
  logName: string;
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
  modLogs?: ModificationLog[];
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params?.id;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjectData = async (userId: number) => {
    if (!projectId) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token");

      const res = await fetch(`${baseUrl}/projects/${projectId}/timeline`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Gagal mengambil data proyek.");

      const data: ProjectDetail = await res.json();

      // =====================================================
      // FIX INTI: Validasi kepemilikan project
      // Bandingkan userId dari project dengan userId akun login
      // Jika beda, tampilkan halaman unauthorized — bukan data orang lain
      // =====================================================
      if (data.userId !== userId) {
        setIsUnauthorized(true);
        return;
      }

      setProject(data);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

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

        // Selalu ambil profil dari API — jangan dari localStorage
        // agar userId selalu sesuai akun yang sedang login
        const profileRes = await fetch(`${baseUrl}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!profileRes.ok) {
          router.push("/login");
          return;
        }

        const profileData = await profileRes.json();
        setCurrentUserId(profileData.id);

        if (projectId) {
          await fetchProjectData(profileData.id);
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

  const handleStartEdit = (log: ModificationLog) => {
    setEditingLogId(log.id);
    setTitle(log.logName);
    setCost(log.cost.toString());
    setImageUrl(log.imageUrl || "");
    setDescription(log.description);
    setShowForm(true);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCost("");
    setImageUrl("");
    setEditingLogId(null);
    setShowForm(false);
  };

  const handleSubmitTimeline = async (e: React.FormEvent) => {
    e.preventDefault();

    const nominalCost = Number(cost) || 0;
    if (nominalCost <= 0) {
      toast.error("Biaya modifikasi harus lebih besar dari 0.");
      return;
    }

    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token");

      let res;
      if (editingLogId) {
        const payloadPut = {
          title,
          description,
          cost: nominalCost,
          imageUrl: imageUrl || undefined,
        };
        res = await fetch(`${baseUrl}/projects/timeline/${editingLogId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payloadPut),
        });
      } else {
        const payloadPost = {
          title,
          description,
          cost: nominalCost,
          imageUrl: imageUrl || undefined,
        };
        res = await fetch(`${baseUrl}/projects/${projectId}/timeline`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payloadPost),
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || (editingLogId ? "Gagal memperbarui log." : "Gagal menyimpan log baru."));
      }

      toast.success(editingLogId ? "Log modifikasi berhasil diperbarui!" : "Log modifikasi baru ditambahkan!");
      resetForm();
      if (currentUserId) await fetchProjectData(currentUserId);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

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

      toast.success("Log pengerjaan berhasil dihapus.");
      if (currentUserId) await fetchProjectData(currentUserId);
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

  // Tampilan khusus jika user mencoba akses project milik orang lain
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
                Project ini bukan milik akun Anda. Anda tidak diizinkan mengakses atau memodifikasi data project orang lain.
              </p>
              <button
                onClick={() => router.push("/buildss")}
                className="mt-2 bg-green-500 hover:bg-green-600 text-black text-sm font-bold px-6 py-2.5 rounded-xl transition-colors"
              >
                Kembali ke Project Saya
              </button>
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  const displayCost = project?.totalSpent && project.totalSpent !== "0"
    ? Number(project.totalSpent).toLocaleString("id-ID")
    : "0";

  return (
    <AuthGuard>
      <Toaster position="top-right" richColors />
      <div className="flex flex-col md:flex-row bg-background text-foreground min-h-screen font-sans">
        <Sidebar activePage="builds" />

        <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full overflow-y-auto">
          <button onClick={() => router.push("/buildss")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Project List
          </button>

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

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Build Progress Timeline</h2>
              <p className="text-xs text-muted-foreground">Historical blueprint logs from modLogs array</p>
            </div>
            <button
              onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
              className="bg-green-500 hover:bg-green-600 text-black text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? "Cancel Operation" : "Add New Timeline"}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmitTimeline} className="bg-card border border-green-500/20 rounded-2xl p-6 mb-8 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold border-b border-border pb-2 text-green-500">
                {editingLogId ? "📝 Edit Existing Performance Log" : "🛠️ Write New Performance Log"}
              </h3>
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
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tulis rincian spesifikasi part baru..." className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" required />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={isSubmitting} className="bg-green-500 text-black text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-green-600 flex items-center gap-2 transition-all disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : editingLogId ? "Update Log" : "Save to Timeline"}
                </button>
                {editingLogId && (
                  <button type="button" onClick={resetForm} className="border border-border bg-transparent text-xs font-medium px-4 py-2.5 rounded-xl hover:bg-muted transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="relative border-l-2 border-border ml-4 pl-6 space-y-8 py-2">
            {project?.modLogs && project.modLogs.length > 0 ? (
              project.modLogs.map((log) => (
                <div key={log.id} className="relative group">
                  <div className="absolute -left-[31px] top-1 bg-background border-2 border-green-500 rounded-full p-1.5 text-green-500 group-hover:bg-green-500 group-hover:text-black transition-colors">
                    <Wrench size={12} />
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-neutral-800 transition-colors flex flex-col md:flex-row gap-5 justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="font-bold text-base tracking-tight text-foreground">{log.logName}</h3>
                        <span className="bg-green-500/10 text-green-400 text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-0.5">
                          <DollarSign size={10} /> IDR {Number(log.cost)?.toLocaleString("id-ID")}
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
                        <img src={log.imageUrl} alt={log.logName} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="md:self-start flex md:flex-col gap-1 justify-end">
                      <button onClick={() => handleStartEdit(log)} className="text-muted-foreground hover:text-green-500 p-1.5 rounded-lg hover:bg-green-500/10 transition-colors" title="Edit Log">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeleteTimeline(log.id)} className="text-muted-foreground hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" title="Delete Log">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground italic pl-2">
                Belum ada rekaman lini masa modifikasi pada kendaraan ini.
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}