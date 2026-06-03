"use client";

import { FormEvent, useEffect, useState } from "react";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/AuthGuard";
import { useRouter, useParams } from "next/navigation"; // Tambahkan useParams
import Link from "next/link";

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

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams(); // Untuk mengambil ID dari URL browser
  const projectId = params.id; 

  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
  });
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Ambil data proyek lama dari backend saat halaman dimuat
  useEffect(() => {
    const fetchOldProjectData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = localStorage.getItem("token");

        // Menembak endpoint GET /projects tapi spesifik ID tertentu jika backend mendukung,
        // atau mengambil semua lalu memfilternya di frontend seperti di bawah ini:
        const res = await fetch(`${baseUrl}/projects`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Gagal mengambil data proyek lama.");

        const allProjects = await res.json();
        // Cari proyek yang ID-nya cocok dengan ID di URL
        const currentProject = allProjects.find((p: Project) => p.id === Number(projectId));

        if (!currentProject) {
          throw new Error("Proyek tidak ditemukan di database.");
        }

        // Masukkan data lama ke dalam state form
        setForm({
          title: currentProject.title || "",
          description: currentProject.description || "",
          imageUrl: currentProject.imageUrl || "",
        });

      } catch (err: unknown) {
        console.error(err);
        const errorMessage = (err as Error).message || "Terjadi kesalahan saat memuat data.";
        setErrorMsg(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (projectId) {
      fetchOldProjectData();
    }
  }, [projectId]);

  const handleInputChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // 2. Fungsi PUT untuk mengirim pembaruan data ke backend
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token");

      if (!token) throw new Error("Sesi habis, silakan login kembali.");

      // Menembak endpoint PUT /projects/{id} secara bersih tanpa bug UI Swagger
      const res = await fetch(`${baseUrl}/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          imageUrl: form.imageUrl,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          throw new Error("Sesi kedaluwarsa. Silakan login ulang.");
        }
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      toast.success("Project berhasil diperbarui!");
      
      // Kembalikan user ke halaman list utama setelah delay
      setTimeout(() => {
        router.push("/buildss");
        router.refresh();
      }, 1000);

    } catch (err: unknown) {
      console.error(err);
      const errorMessage = (err as Error).message || "Gagal memperbarui proyek.";
      setErrorMsg(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <Toaster position="top-right" richColors />
      <div className="max-w-7xl mx-auto pb-10 flex flex-col md:flex-row gap-6">
        <Sidebar activePage="builds" />

        <main className="flex-1">
          {/* Tombol Kembali */}
          <Link href="/buildss" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm transition-colors">
            <ArrowLeft size={16} /> Back to All Builds
          </Link>

          <h2 className="text-3xl font-bold mb-6 text-foreground">Edit Build Project</h2>

          {isLoadingData ? (
            // Indikator Loading saat mengambil data lama
            <div className="flex flex-col items-center justify-center py-20 gap-2 max-w-2xl border border-border rounded-3xl bg-card">
              <Loader2 className="animate-spin text-green-500" size={32} />
              <p className="text-sm text-muted-foreground">Mengambil data lama dari database...</p>
            </div>
          ) : (
            // Tampilan Form Edit
            <section className="rounded-3xl border border-border bg-card p-6 shadow-lg shadow-black/20 max-w-2xl">
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <label className="space-y-2 text-sm text-muted-foreground">
                  Project Title *
                  <input
                    value={form.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                    className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. Honda Civic Type R Build"
                  />
                </label>

                <label className="space-y-2 text-sm text-muted-foreground">
                  Description
                  <textarea
                    value={form.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary"
                    placeholder="Tell about the build..."
                  />
                </label>

                <label className="space-y-2 text-sm text-muted-foreground">
                  Image URL
                  <input
                    value={form.imageUrl}
                    onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                    className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary"
                    placeholder="https://example.com/image.jpg"
                  />
                </label>

                {errorMsg && (
                  <div className="text-red-500 text-sm bg-red-500/10 p-2 rounded">
                    {errorMsg}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center pt-2">
                  <p className="text-sm text-muted-foreground">Ubah data di atas lalu klik simpan.</p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-green-600 disabled:opacity-50"
                  >
                    <Save size={16} />
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </section>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}