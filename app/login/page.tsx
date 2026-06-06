"use client";
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast, Toaster } from 'sonner';

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Email atau password salah.");
      }

      // =====================================================
      // FIX UTAMA: Bersihkan semua data akun lama dulu
      // sebelum menyimpan token akun baru agar tidak
      // ada kebocoran data antara sesi / akun berbeda
      // =====================================================
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("profile");

      // Simpan token akun baru
      let tokenValue = "";
      if (data.token) {
        tokenValue = data.token;
      } else if (data.accessToken) {
        tokenValue = data.accessToken;
      } else if (data.data?.token) {
        tokenValue = data.data.token;
      }

      if (!tokenValue) {
        throw new Error("Token tidak ditemukan dalam response. Hubungi developer.");
      }

      localStorage.setItem("token", tokenValue);

      // --- VERIFIKASI ROLE SEBELUM MASUK ---
      const profileRes = await fetch(`${baseUrl}/auth/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenValue}`,
          "Content-Type": "application/json",
        },
      });

      if (!profileRes.ok) {
        localStorage.removeItem("token");
        throw new Error("Gagal mengambil profil akun.");
      }

      const profileData = await profileRes.json();
      const actualRole = (profileData.role || profileData.roles?.[0] || "customer").toLowerCase();

      // Simpan user profile ke localStorage
      localStorage.setItem("user", JSON.stringify(profileData));

      toast.success("Login berhasil!");
      
      setTimeout(() => {
        if (actualRole === "mods") {
          router.push("/moderator");
        } else {
          router.push("/customer");
        }
      }, 1000); 

    } catch (err: unknown) {
      const errorMessage = (err as Error).message || "Terjadi kesalahan sistem, coba lagi nanti.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100 text-slate-950 dark:bg-[#020617] dark:text-white font-sans px-4 py-12 flex items-center justify-center">
      <Toaster position="top-right" richColors />
      <div
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 20%, rgba(70, 211, 92, 0.18), transparent 20%), radial-gradient(circle at 80% 15%, rgba(56, 126, 255, 0.16), transparent 18%), linear-gradient(180deg, #020617 0%, #050812 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 block dark:hidden"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.15), transparent 18%), radial-gradient(circle at 80% 15%, rgba(16, 185, 129, 0.12), transparent 16%), linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
        }}
      />
      <div className="pointer-events-none absolute -top-20 -right-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/20" />
      <div className="pointer-events-none absolute -bottom-24 left-6 h-56 w-56 rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/15" />
      <div className="absolute inset-0 bg-white/80 dark:bg-black/40" />

      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-slate-200/60 bg-white/90 p-8 shadow-[0_30px_60px_rgba(15,23,42,0.15)] backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-slate-950/90">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-300 opacity-90 mb-3">Welcome back</p>
            <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Login</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Masuk ke dalam akun Anda untuk melanjutkan.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className="rounded-xl px-4 py-3 text-sm bg-slate-50 border border-slate-300 text-slate-950 placeholder:text-slate-500 focus:border-slate-900 focus:bg-white focus:outline-none transition dark:bg-slate-900/80 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="rounded-xl px-4 py-3 text-sm bg-slate-50 border border-slate-300 text-slate-950 placeholder:text-slate-500 focus:border-slate-900 focus:bg-white focus:outline-none transition dark:bg-slate-900/80 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>



          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Signing in...
              </>
            ) : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Belum punya akun?{' '}
          <a href="/register" className="text-emerald-600 font-semibold hover:underline dark:text-emerald-300">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}