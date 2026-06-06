"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldAlert, Tag, Wallet, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for top up (Moderator Tool)
  const [targetUserId, setTargetUserId] = useState("");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [panelMessage, setPanelMessage] = useState("");
  const [panelError, setPanelError] = useState("");

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleModeratorTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPanelMessage("");
    setPanelError("");

    const userIdNum = Number(targetUserId);
    const amountNum = Number(topUpAmount);

    if (isNaN(userIdNum) || userIdNum <= 0) {
      setPanelError("User ID must be a valid positive number.");
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setPanelError("Amount must be a valid positive number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token");

      const res = await fetch(`${baseUrl}/auth/wallet/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: userIdNum,
          amount: amountNum,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to add funds.");
      }

      setPanelMessage(`Success! Credited $${amountNum} to User ID: ${userIdNum}.`);
      setTargetUserId("");
      setTopUpAmount("");
      toast.success(`Wallet updated for User ${userIdNum}!`);
      
      // Refresh metrics
      fetchData();
    } catch (err: unknown) {
      console.error(err);
      setPanelError((err as Error).message || "An error occurred.");
      toast.error("Failed to deposit funds.");
    } finally {
      setIsSubmitting(false);
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
                  Loading Moderator Workspace...
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
                      System-wide statistics & administrative tools
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={fetchData}
                      className="p-2 border border-border rounded-xl bg-card hover:bg-muted text-muted-foreground transition-colors"
                      title="Sync Data"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                      Moderator Access
                    </span>
                  </div>
                </div>

                {/* Grid layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left columns: Tools & Listings */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Metrics Overview */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                      <h2 className="text-base font-bold mb-4 tracking-tight">System Statistics</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-muted/40 border border-border p-4 rounded-xl">
                          <p className="text-xs text-muted-foreground font-medium uppercase">Active Garage Projects</p>
                          <p className="text-2xl font-black mt-1 text-foreground">{metrics?.totalProjects ?? 0}</p>
                        </div>
                        <div className="bg-muted/40 border border-border p-4 rounded-xl">
                          <p className="text-xs text-muted-foreground font-medium uppercase">Total Platform Investment</p>
                          <p className="text-2xl font-black mt-1 text-amber-500">
                            IDR {(metrics?.totalInvestment ?? 0).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Active Listings */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-base font-bold tracking-tight flex items-center gap-1.5">
                          <Tag size={16} className="text-amber-500" />
                          Global Marketplace Listings
                        </h2>
                        <span className="text-xs bg-muted border border-border px-2 py-0.5 rounded-full text-muted-foreground font-semibold">
                          {listings.length} items
                        </span>
                      </div>

                      {listings.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-4 text-center">
                          No components listed in the marketplace.
                        </p>
                      ) : (
                        <div className="divide-y divide-border/60">
                          {listings.map((item) => (
                            <div key={item.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                              <div>
                                <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">ID: {item.id}</p>
                              </div>
                              <span className="text-sm font-black text-amber-500 font-mono">
                                IDR {Number(item.price).toLocaleString("id-ID")}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Moderator Actions (Add Money) */}
                  <div className="space-y-8">
                    <div className="bg-card border border-amber-500/20 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-base font-bold text-amber-500 flex items-center gap-2 mb-4">
                        <Wallet size={18} />
                        Deposit Testing Money
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                        As a moderator, you can directly credit virtual testing money to any user account registered in the garage tracking database.
                      </p>

                      <form onSubmit={handleModeratorTopUp} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Target User ID</label>
                          <input
                            type="number"
                            value={targetUserId}
                            onChange={(e) => setTargetUserId(e.target.value)}
                            placeholder="e.g. 1"
                            className="w-full bg-input border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-amber-500 font-mono"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Amount ($ / IDR)</label>
                          <input
                            type="number"
                            value={topUpAmount}
                            onChange={(e) => setTopUpAmount(e.target.value)}
                            placeholder="e.g. 1000"
                            className="w-full bg-input border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-amber-500 font-mono"
                            required
                          />
                        </div>

                        {panelMessage && (
                          <div className="flex gap-2 items-center bg-green-500/10 border border-green-500/20 text-green-500 text-xs p-3 rounded-xl font-medium animate-in fade-in-50 duration-200">
                            <CheckCircle size={14} className="shrink-0" />
                            <span>{panelMessage}</span>
                          </div>
                        )}

                        {panelError && (
                          <div className="flex gap-2 items-center bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl font-medium animate-in fade-in-50 duration-200">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>{panelError}</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl py-3 text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="animate-spin" size={14} />
                              Processing Deposit...
                            </>
                          ) : (
                            "Deposit Funds"
                          )}
                        </button>
                      </form>
                    </div>
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
