"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  // 1. State untuk menyimpan data dari input form
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  // 2. State untuk status loading dan error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fungsi untuk membaca perubahan setiap input otomatis
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 3. Fungsi utama untuk menembak API saat tombol diklik
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah halaman reload otomatis
    setLoading(true);
    setError("");

    // Validasi sederhana: Cek apakah password cocok
    if (formData.password !== formData.confirmPassword) {
      setError("Password dan Confirm Password tidak cocok!");
      setLoading(false);
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      // Antisipasi jika developer lupa setup .env
      if (!baseUrl) {
        throw new Error("API Base URL tidak ditemukan. Periksa file .env.local Anda.");
      }

      const response = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      // Antisipasi jika server mengembalikan HTML (Error 404/502) dan bkn JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server tidak merespon dengan format JSON yang valid.");
      }

      const data = await response.json();

      // Jika backend mengembalikan error (status code selain 200-299)
      if (!response.ok) {
        throw new Error(data.message || "Gagal melakukan registrasi");
      }

      // Jika berhasil, arahkan pengguna ke halaman login
      alert("Registrasi sukses! Silakan login.");
      router.push("/login");
    } catch (err: unknown) {
      // Menangkap error dari backend atau network error
      setError(
        (err as Error).message || "Terjadi kesalahan sistem, coba lagi nanti.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center py-16 font-sans overflow-hidden">
      {/* Background Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center block dark:hidden"
        style={{
          backgroundImage:
            'linear-gradient(rgba(248,249,250,0.76), rgba(255,255,255,0.62)), url("https://images.unsplash.com/photo-1571607387434-6cd90c04d99c?auto=format&fit=crop&w=1600&q=80")',
        }}
      />
      <div
        className="absolute inset-0 bg-cover bg-center hidden dark:block"
        style={{
          backgroundImage:
            'linear-gradient(rgba(10,10,10,0.76), rgba(10,10,10,0.82)), url("https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1600&q=80")',
        }}
      />
      <div className="absolute inset-0 bg-white/10 dark:bg-black/40" />

      {/* Form Card */}
      <div className="relative z-10 w-full max-w-sm bg-card/95 border border-border backdrop-blur-xl rounded-[28px] p-6 sm:p-8 shadow-2xl shadow-black/40">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Create account
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Fill in your details to get started
            </p>
          </div>
        </div>

        {/* Card Header */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-card-foreground">Register</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Create a new account to join the community
          </p>
        </div>

        {/* Tambahan: Alert Box untuk Menampilkan Error */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-500 text-xs p-3 rounded-xl font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              placeholder="john@example.com"
              className="bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-muted-foreground">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading} // Cegah spam klik saat proses
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
            >
              {loading ? "Processing..." : "Create Account"}
            </button>
          </div>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-[#46d35c] font-semibold hover:underline"
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}