"use client";

import { FormEvent, useState } from "react";
import { Plus, ArrowLeft } from "lucide-react";
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