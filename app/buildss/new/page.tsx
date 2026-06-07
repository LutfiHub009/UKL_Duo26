"use client";

import { FormEvent, useState } from "react";
import { Plus, ArrowLeft, Tag as TagIcon, X } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/AuthGuard";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DEFAULT_FORM = {
  title: "",
  description: "",
  imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800",
};

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [status, setStatus] = useState<"Planning" | "WIP" | "Complete">("Planning");

  const handleInputChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) {
      const validationMessage = "Title is required";
      toast.error(validationMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token");

      const res = await fetch(`${baseUrl}/projects`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          imageUrl: form.imageUrl,
          tags,
          status,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      toast.success("Project baru berhasil dibuat!");
      
      // Setelah sukses, arahkan kembali ke rute halaman daftar project utama
      setTimeout(() => {
        router.push("/buildss");
        router.refresh();
      }, 1000);

    } catch (err: unknown) {
      console.error(err);
      const errorMessage = (err as Error).message || "Failed to create project.";
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
          {/* Tombol Back */}
          <Link href="/buildss" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm transition-colors">
            <ArrowLeft size={16} /> Back to All Builds
          </Link>

          <h2 className="text-3xl font-bold mb-6 text-foreground">Create a New Build Project</h2>

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

              <label className="space-y-2 text-sm text-muted-foreground">
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "Planning" | "WIP" | "Complete")}
                  className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="Planning">Planning</option>
                  <option value="WIP">WIP</option>
                  <option value="Complete">Complete</option>
                </select>
              </label>

              <label className="space-y-2 text-sm text-muted-foreground">
                Tags
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-2 bg-muted border border-border rounded-full px-3 py-1 text-xs">
                      <TagIcon size={14} />
                      <span className="max-w-xs truncate">{t}</span>
                      <button type="button" onClick={() => setTags((s) => s.filter(x => x !== t))} className="p-1 rounded-full hover:bg-red-500/10">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="mt-2 flex gap-2">
                  <input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const t = newTag.trim(); if (t && !tags.includes(t)) { setTags(s => [...s, t]); setNewTag(''); } }} }
                    placeholder="Tambah tag custom, mis. Stage 3"
                    className="flex-1 rounded-2xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary"
                  />
                  <button type="button" onClick={() => { const t = newTag.trim(); if (!t) return; if (tags.includes(t)) { toast.error('Tag sudah ada'); return; } setTags(s => [...s, t]); setNewTag(''); }} className="inline-flex items-center gap-2 rounded-2xl bg-green-500 px-4 py-2 text-sm font-semibold text-black hover:bg-green-600">
                    <Plus size={14} />
                    Tambah
                  </button>
                </div>
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center pt-2">
                <p className="text-sm text-muted-foreground">Title is required to submit.</p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-green-600 disabled:opacity-50"
                >
                  <Plus size={16} />
                  {isSubmitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}