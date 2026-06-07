"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  ShieldAlert,
  Tag,
  RefreshCw,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/AuthGuard";
import { RoleGuard } from "@/components/RoleGuard";
import { toast, Toaster } from "sonner";

type MarketListing = {
  id: number;
  name: string;
  price: string;
};

type DashboardMetrics = {
  totalProjects: number;
  totalInvestment: number;
  recentUpdatesCount: number;
};

export default function ModeratorDashboardPage() {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = localStorage.getItem("token");

        // Fetch metrics and marketplace listings in parallel
        const [metricsRes, listingsRes] = await Promise.all([
          fetch(`${baseUrl}/projects/dashboard/metrics`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${baseUrl}/projects/market/listings`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (metricsRes.ok) {
          setMetrics(await metricsRes.json());
        }
        if (listingsRes.ok) {
          setListings(await listingsRes.json());
        }
      } catch (err) {
        console.error("Moderator Dashboard Fetch Error:", err);
        toast.error("Failed to load moderator dashboard metrics.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token");

      const [metricsRes, listingsRes] = await Promise.all([
        fetch(`${baseUrl}/projects/dashboard/metrics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/projects/market/listings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (metricsRes.ok) {
        setMetrics(await metricsRes.json());
      }
      if (listingsRes.ok) {
        setListings(await listingsRes.json());
      }
      toast.success("Data synced successfully");
    } catch (err) {
      console.error("Refresh Error:", err);
      toast.error("Failed to sync data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["mods"]}>
        <Toaster position="top-right" richColors />
        <div className="flex min-h-screen bg-background text-foreground font-sans transition-colors">
          <Sidebar activePage="dashboard" />

          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center flex-1 py-40 gap-2">
                <Loader2 className="animate-spin text-amber-500" size={36} />
                <p className="text-sm text-muted-foreground">
                  memuat dashboard Moderator...
                </p>
              </div>
            ) : (
              <div className="flex-1 px-8 pb-12 pt-6">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center border-b border-border pb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                      <ShieldAlert className="text-amber-500" size={24} />
                      Moderator Control Center
                    </h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      Dashboard  moderator untuk memantau dan mengelola aktivitas platform secara real-time.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleRefresh}
                      className="p-2 border border-border rounded-xl bg-card hover:bg-muted text-muted-foreground transition-colors"
                      title="Sync Data"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                      Akses Moderator
                    </span>
                  </div>
                </div>

                {/* Grid layout */}
                <div className="space-y-8">
                  {/* Metrics Overview - Full Width */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h2 className="text-base font-bold mb-6 tracking-tight">
                      Statistik Sistem
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 p-6 rounded-xl">
                        <p className="text-xs text-muted-foreground font-medium uppercase">
                          projects terdaftar
                        </p>
                        <p className="text-3xl font-black mt-2 text-amber-500">
                          {metrics?.totalProjects ?? 0}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 p-6 rounded-xl">
                        <p className="text-xs text-muted-foreground font-medium uppercase">
                          Total Investasi
                        </p>
                        <p className="text-2xl font-black mt-2 text-blue-500">
                          IDR{" "}
                          {(metrics?.totalInvestment ?? 0).toLocaleString(
                            "id-ID",
                          )}
                        </p>
                      </div>
                      <div className="bg-linear-to-br from-green-500/10 to-green-500/5 border border-green-500/20 p-6 rounded-xl">
                        <p className="text-xs text-muted-foreground font-medium uppercase">
                          pembaruan terkini
                        </p>
                        <p className="text-3xl font-black mt-2 text-green-500">
                          {metrics?.recentUpdatesCount ?? 0}
                        </p>
                      </div>
                      <div className="bg-linear-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 p-6 rounded-xl">
                        <p className="text-xs text-muted-foreground font-medium uppercase">
                          Jumlah barang
                        </p>
                        <p className="text-3xl font-black mt-2 text-purple-500">
                          {listings.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Marketplace Listings */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-base font-bold tracking-tight flex items-center gap-1.5">
                        <Tag size={18} className="text-amber-500" />
                        List Marketplace 
                      </h2>
                      <span className="text-xs bg-muted border border-border px-3 py-1 rounded-full text-muted-foreground font-semibold">
                        {listings.length} items
                      </span>
                    </div>

                    {listings.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-sm text-muted-foreground italic">
                          No components listed in the marketplace yet.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {listings.map((item) => (
                          <div
                            key={item.id}
                            className="border border-border rounded-xl p-4 hover:bg-muted/50 transition-colors"
                          >
                            <h4 className="font-bold text-sm text-foreground mb-2 line-clamp-2">
                              {item.name}
                            </h4>
                            <p className="text-xs text-muted-foreground font-mono mb-3">
                              ID: {item.id}
                            </p>
                            <span className="text-lg font-black text-amber-500 font-mono">
                              IDR {Number(item.price).toLocaleString("id-ID")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
