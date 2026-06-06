"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { User, Mail, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/AuthGuard";
import { WalletSection } from "@/components/WalletSection";

type UserProfile = {
  id: number;
  username: string;
  email: string;
};

export default function ProfileDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = localStorage.getItem("token");

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
                  Manage your account and wallet
                </p>
              </div>

              <div className="flex flex-col xl:flex-row gap-6">
                {/* Kolom Kiri: Detail Akun */}
                <div className="w-full xl:w-80 bg-card border border-border rounded-2xl p-6 flex flex-col text-card-foreground">
                  <h2 className="font-semibold text-lg mb-6 text-card-foreground">
                    Account Details
                  </h2>

                  <div className="flex flex-col items-center mb-8">
                    <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-2 border-[#333]">
                      <Image
                        src="https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=200&auto=format&fit=crop"
                        alt={profile?.username || "User"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
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

                {/* Kolom Kanan: Wallet */}
                <div className="flex-1 space-y-8">
                  <div className="space-y-3">
                    <h2 className="font-semibold text-xl">My Wallet</h2>
                    <WalletSection
                      balance={balance}
                      setBalance={setBalance}
                      currentUserId={profile?.id}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}