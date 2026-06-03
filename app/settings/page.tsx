"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, User, Shield, Bell } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/AuthGuard";

export default function SettingsPage() {
  const router = useRouter();

  // Fungsi untuk menangani Clean Logout
  const handleLogout = () => {
    try {
      // 1. Hapus token JWT secara bersih dari penyimpanan lokal
      localStorage.removeItem("token");
      
      // Jika ada data user/profile lain yang tersimpan, hapus juga di sini
      // localStorage.removeItem("user");

      toast.success("Sesi pengguna berhasil dibersihkan.");
      
      // 2. Alihkan pengguna secara paksa ke halaman login
      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("Gagal menghapus sesi:", error);
      toast.error("Gagal menghapus sesi. Silakan coba lagi.");
    }
  };

  return (
    <AuthGuard>
      <Toaster position="top-right" richColors />
      <div className="flex flex-col md:flex-row bg-background text-foreground transition-all duration-300 font-sans overflow-hidden min-h-screen">
        {/* SIDEBAR */}
        <Sidebar activePage="settings" />

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col h-full overflow-y-auto bg-background text-foreground transition-all duration-300">
          <div className="p-6 md:p-8 max-w-4xl w-full mx-auto">
            
            {/* Header Halaman */}
            <div className="mb-8 flex items-center gap-3">
              <Settings className="text-primary" size={28} />
              <div>
                <h1 className="text-3xl font-bold mb-1 tracking-tight">Settings</h1>
                <p className="text-gray-400 text-sm">
                  Manage your account preferences and application configurations
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* SEKSI AKSI AKUN: Danger Zone / Sign Out */}
              <div className=" border border-red-500/20 rounded-2xl p-6 text-card-foreground shadow-sm bg-red-500/1">
                <div className="flex items-center gap-3 mb-2">
                  <LogOut size={20} className="text-red-500" />
                  <h2 className="font-semibold text-lg text-foreground">Account Actions</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                  Sign out from this device. To access your dashboard metrics and project configurations again, you will need to re-authenticate.
                </p>
                
                <div className="border-t border-border/60 pt-5 flex items-center justify-between">
                  <div className="hidden sm:block">
                    <p className="text-xs font-medium text-foreground">Are you ready to leave?</p>
                    <p className="text-[11px] text-muted-foreground">Your active draft builds are securely synchronized.</p>
                  </div>
                  
                  {/* TOMBOL LOGOUT */}
                  <button 
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm w-full sm:w-auto"
                  >
                    <LogOut size={16} />
                    Logout Account
                  </button>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}