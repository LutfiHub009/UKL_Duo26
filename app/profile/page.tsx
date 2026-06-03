"use client";

import React, { useEffect, useState } from "react";
import { User, Search, Mail, Loader2, FolderKanban } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/AuthGuard";
import { WalletSection } from "@/components/WalletSection";

// Tipe data profil dasar dari GET /auth/profile
type UserProfile = {
  id: number;
  username: string;
  email: string;
};

// Struktur data Project yang disesuaikan menggunakan 'title'
type ProjectItem = {
  id: number | string;
  title: string;        // Mengubah 'name' menjadi 'title' sesuai data database Anda
  description?: string;  // Field deskripsi dari database
  totalCost?: number | string;
  cost?: number | string;
  status?: string;
  imageUrl?: string;     
};

export default function ProfileDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [projects, setProjects] = useState<ProjectItem[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = localStorage.getItem("token");

        // 1. Ambil data Profil & Wallet secara paralel
        const [profileRes, walletRes] = await Promise.all([
          fetch(`${baseUrl}/auth/profile`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${baseUrl}/auth/wallet`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!profileRes.ok || !walletRes.ok) {
          throw new Error("Gagal mengambil data akun dari server.");
        }

        const profileData = await profileRes.json();
        const walletData = await walletRes.json();

        setProfile(profileData);

        // 2. Ambil data proyek berdasarkan userId (GET /projects?userId=id)
        if (profileData && profileData.id) {
          try {
            const projectsRes = await fetch(`${baseUrl}/projects?userId=${profileData.id}`, {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            });

            if (projectsRes.ok) {
              const projectsData = await projectsRes.json();
              console.log("ISI RESPONS GET PROJECTS:", projectsData);
              setProjects(Array.isArray(projectsData) ? projectsData : []);
            }
          } catch (projErr) {
            console.error("Gagal memuat proyek:", projErr);
          }
        }

        // 3. Pasang saldo wallet (currentBalance)
        if (walletData && walletData.currentBalance !== undefined) {
          setBalance(String(walletData.currentBalance));
        } else {
          const currentBalance =
            walletData.currentWalletBalance ||
            walletData.balance ||
            walletData.wallet ||
            "0";
          setBalance(String(currentBalance));
        }
      } catch (err: unknown) {
        console.error(err);
        setErrorMsg((err as Error).message || "Koneksi ke database gagal.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return (
    <AuthGuard>
      <div className="flex flex-col md:flex-row bg-background text-foreground transition-all duration-300 font-sans overflow-hidden">
        <Sidebar activePage="profile" />

        <main className="flex-1 flex flex-col h-full overflow-y-auto bg-background text-foreground transition-all duration-300">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between px-8 py-5 border-b border-border bg-popover gap-4">
            <div className="relative w-full sm:w-96">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Search projects, tags..."
                className="w-full bg-input border border-border rounded-lg py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </header>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center flex-1 py-40 gap-2">
              <Loader2 className="animate-spin text-green-500" size={36} />
              <p className="text-sm text-muted-foreground">
                Syncing dashboard data...
              </p>
            </div>
          ) : errorMsg ? (
            <div className="p-8 text-red-500">{errorMsg}</div>
          ) : (
            <div className="p-6 md:p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-1">Profile</h1>
                <p className="text-gray-400 text-sm">
                  Manage your account and projects
                </p>
              </div>

              <div className="flex flex-col xl:flex-row gap-6">
                {/* KIBLAT KIRI: Detail Akun */}
                <div className="w-full xl:w-80 bg-card border border-border rounded-2xl p-6 flex flex-col text-card-foreground">
                  <h2 className="font-semibold text-lg mb-6 text-card-foreground">
                    Account Details
                  </h2>

                  <div className="flex flex-col items-center mb-8">
                    <img
                      src="https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=200&auto=format&fit=crop"
                      alt={profile?.username || "User"}
                      className="w-28 h-28 rounded-full object-cover mb-4 border-2 border-[#333]"
                    />
                    <h3 className="text-xl font-bold">
                      {profile?.username || "User"}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      @
                      {(profile?.username || "user")
                        .toLowerCase()
                        .replace(/\s+/g, "")}
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-gray-300 text-sm">
                      <Mail size={16} className="text-gray-500" />
                      <span>{profile?.email || "No Email"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 text-sm">
                      <User size={16} className="text-gray-500" />
                      <span>Member verified</span>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className="text-muted-foreground text-sm mb-3">
                      Interests
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-muted px-3 py-1 rounded-full text-xs font-medium border border-border text-muted-foreground">
                        #JDM
                      </span>
                      <span className="bg-muted px-3 py-1 rounded-full text-xs font-medium border border-border text-muted-foreground">
                        #Drift
                      </span>
                    </div>
                  </div>
                </div>

                {/* KIBLAT KANAN: Bagian Wallet & Daftar Proyek Dinamis */}
                <div className="flex-1 space-y-8">
                  {/* Komponen Dompet Digital */}
                  <div className="space-y-3">
                    <h2 className="font-semibold text-xl">My Wallet</h2>
                    <WalletSection
                      balance={balance}
                      setBalance={setBalance}
                      currentUserId={profile?.id}
                    />
                  </div>

                  {/* Bagian My Projects */}
                  <div>
                    <div className="mb-6">
                      <h2 className="font-semibold text-xl mb-1">
                        My Projects
                      </h2>
                      <p className="text-gray-400 text-sm">{projects.length} active builds</p>
                    </div>

                    {projects.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-2xl bg-card text-muted-foreground text-center gap-2">
                        <FolderKanban size={32} className="text-gray-500" />
                        <p className="text-sm font-medium">No projects found</p>
                        <p className="text-xs text-gray-500">You havent created any vehicle build projects yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {projects.map((project) => (
                          <div 
                            key={project.id} 
                            className="bg-card border border-border rounded-2xl overflow-hidden group text-card-foreground shadow-sm flex flex-col justify-between"
                          >
                            <div>
                              <div className="relative h-48 bg-card/80">
                                <img
                                  src={project.imageUrl || "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=600&auto=format&fit=crop"}
                                  alt={project.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <span className="absolute top-3 right-3 bg-popover/70 backdrop-blur-sm text-popover-foreground text-xs font-bold px-3 py-1 rounded-full uppercase">
                                  {project.status || "WIP"}
                                </span>
                              </div>
                              <div className="p-5 pb-2">
                                {/* Menampilkan Judul Proyek memakai properti 'title' */}
                                <h3 className="font-bold text-lg mb-1 line-clamp-1 text-foreground">
                                  {project.title || "Untitled Project"}
                                </h3>
                                {/* Menampilkan Deskripsi Proyek */}
                                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem] leading-relaxed">
                                  {project.description || "No description provided for this project build."}
                                </p>
                              </div>
                            </div>
                            
                            <div className="p-5 pt-0 mt-4">
                              <div className="flex justify-between items-center text-sm pt-3 border-t border-border/60">
                                <span className="text-gray-400">Total Cost:</span>
                                <span className="font-bold text-card-foreground">
                                  IDR {Number(project.totalCost || project.cost || 0).toLocaleString("id-ID")}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div> {/* End Kolom Kanan */}
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}