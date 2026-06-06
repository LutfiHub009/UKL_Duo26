"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  ShoppingBag,
  Plus,
  Tag,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/AuthGuard";

type MarketListing = {
  id: number;
  name: string;
  price: string; // Sesuai respons Swagger Anda yang bertipe string
};

type UserProfile = {
  role?: string;
  roles?: string[];
};

export default function MarketplacePage() {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // State Form Input untuk POST /projects/market/listings
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // 1. Ambil data katalog suku cadang dari server (GET)
  const fetchMarketListings = async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token");

      const res = await fetch(`${baseUrl}/projects/market/listings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Gagal memuat katalog marketplace.");
      const data = await res.json();
      setListings(data);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRole = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token");
      if (!token) return;

      const savedUser = localStorage.getItem("user") || localStorage.getItem("profile");
      if (savedUser) {
        const parsedUser: UserProfile = JSON.parse(savedUser);
        const savedRole = parsedUser.role || parsedUser.roles?.[0];
        if (savedRole) {
          setUserRole(savedRole.toLowerCase());
          return;
        }
      }

      const res = await fetch(`${baseUrl}/auth/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) return;
      const profileData: UserProfile = await res.json();
      const role = profileData.role || profileData.roles?.[0];
      if (role) setUserRole(role.toLowerCase());
    } catch (error) {
      console.error("Gagal mengambil role pengguna:", error);
    }
  };

  useEffect(() => {
    const loadMarketData = async () => {
      await fetchMarketListings();
    };

    const loadProfile = async () => {
      await fetchUserRole();
    };

    loadMarketData();
    loadProfile();
  }, []);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token");

      const res = await fetch(`${baseUrl}/projects/market/listings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          price: Number(price) || 0, // Dikonversi ke number sesuai skema Swagger Anda
        }),
      });

      if (!res.ok) throw new Error("Gagal mengiklankan part baru.");

      toast.success(`Part "${name}" berhasil diiklankan di marketplace!`);
      setName("");
      setPrice("");
      setShowAddForm(false);
      fetchMarketListings(); // Muat ulang list agar part baru langsung muncul
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Eksekusi Pembelian Suku Cadang (POST ke /purchase/{id})
  const handlePurchasePart = async (listingId: number, partName: string) => {
    const confirmBuy = window.confirm(
      `Apakah Anda yakin ingin membeli "${partName}"?`,
    );
    if (!confirmBuy) return;

    setIsPurchasing(listingId);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${baseUrl}/projects/market/purchase/${listingId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Transaksi pembelian gagal.");

      toast.success(
        `Berhasil membeli "${partName}"! Part siap dipasang di mobil Anda.`,
      );
      fetchMarketListings(); // Segarkan data pasar
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsPurchasing(null);
    }
  };

  return (
    <AuthGuard>
      <Toaster position="top-right" richColors />
      <div className="flex flex-col md:flex-row bg-background text-foreground min-h-screen font-sans">
        {/* Hubungkan ke Sidebar Navigasi Utama */}
        <Sidebar activePage="marketplace" />

        <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full overflow-y-auto">
          {/* Header Konten */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6 mb-8">
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                <ShoppingBag className="text-green-500" size={24} /> Performance
                Suku Cadang Marketplace
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Jual dan beli suku cadang modifikasi performa tinggi dari
                komunitas BuildTracker
              </p>
            </div>
            
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-green-500 hover:bg-green-600 text-black text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-center"
            >
              <Plus size={16} />{" "}
              {showAddForm ? "Tutup Form" : "Jual Suku Cadang Baru"}
            </button>
          </div>

          {/* Form Pengisian Penjualan Suku Cadang Baru */}
          {showAddForm && (
            <form
              onSubmit={handleCreateListing}
              className="bg-card border border-green-500/20 rounded-2xl p-6 mb-8 space-y-4 shadow-sm max-w-xl animate-in fade-in-50 duration-200"
            >
              <h3 className="text-sm font-bold text-green-500 flex items-center gap-1.5">
                <Tag size={14} /> Jual Komponen Modifikasi Baru
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Nama Suku Cadang *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Stage 3 Turbocharger"
                    className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-green-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Harga Jual (IDR) *
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Contoh: 4500000"
                    className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-green-500"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-500 text-black text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-green-600 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  "Iklankan Suku Cadang"
                )}
              </button>
            </form>
          )}

          {/* Grid Katalog Penjualan */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-green-500" size={36} />
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-neutral-800 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Placeholder Gambar Visual Komponen Suku Cadang */}
                    <div className="h-32 bg-muted/50 border border-border/40 rounded-xl mb-4 flex items-center justify-center text-muted-foreground/40 group-hover:text-green-500/30 transition-colors">
                      <ShoppingBag size={48} strokeWidth={1} />
                    </div>
                    <h3 className="font-bold text-base text-foreground mt-2 group-hover:text-green-400 transition-colors">
                      {item.name || "Suku Cadang Tanpa Nama"}
                    </h3>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">
                        Harga Suku Cadang
                      </p>
                      <p className="text-base font-black flex items-center text-green-500">
                        <DollarSign size={14} className="mt-0.5" />{" "}
                        {Number(item.price).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <button
                      onClick={() => handlePurchasePart(item.id, item.name)}
                      disabled={isPurchasing !== null}
                      className="bg-secondary hover:bg-green-500 hover:text-black border border-border text-foreground text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      {isPurchasing === item.id ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <>
                          <ShoppingCart size={14} /> Beli
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/30">
              <p className="text-sm text-muted-foreground italic">
                Belum ada suku cadang modifikasi yang dijual di marketplace.
              </p>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}