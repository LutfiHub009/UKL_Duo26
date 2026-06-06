"use client";

import { useState } from "react";
import { Wallet, Plus, Loader2 } from "lucide-react";

interface WalletSectionProps {
  balance: string;
  setBalance: React.Dispatch<React.SetStateAction<string>>;
  currentUserId: number | undefined;
}

export function WalletSection({ balance, setBalance, currentUserId }: WalletSectionProps) {
  const [amount, setAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleInputChange = (val: string) => {
    setAmount(Number(val));
    // Sembunyikan pesan notifikasi lama saat pengguna mulai mengetik nominal baru
    if (message) setMessage("");
    if (errorMsg) setErrorMsg("");
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setErrorMsg("Masukkan nominal yang valid.");
      return;
    }

    // Validasi jika data ID dari GET /auth/profile belum selesai dimuat
    if (!currentUserId) {
      setErrorMsg("Gagal mengidentifikasi akun Anda. Silakan refresh halaman.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    setMessage("");

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token");

      const res = await fetch(`${baseUrl}/auth/wallet/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: currentUserId, amount }), 
      });

      if (!res.ok) throw new Error("Gagal mengisi saldo.");

      const data = await res.json();
      
      setMessage(data.message || "Funds deposited successfully!");
      
      // Ambil balance terbaru dari properti respons backend (currentWalletBalance)
      const newBalance = data.currentWalletBalance ?? data.currentBalance ?? data.balance ?? "0";
      setBalance(String(newBalance)); 
      setAmount(0);

    } catch (err: unknown) {
      console.error(err);
      setErrorMsg((err as Error).message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {/* Tampilan Saldo */}
      <div className="bg-linear-to-br from-green-500 to-emerald-700 text-black p-6 rounded-3xl shadow-lg h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2 opacity-80">
            <Wallet size={20} />
            <span className="text-xs font-bold tracking-wider uppercase">saldo akun</span>
          </div>
          <div className="text-3xl font-black font-mono">
            ${Number(balance).toLocaleString("id-ID")}
          </div>
        </div>
        <p className="text-[11px] opacity-70 mt-6 leading-tight">
          *Saldo tersimpan dengan aman di database User ID: {currentUserId || "Loading..."}
        </p>
      </div>

      {/* Form Deposit */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h4 className="text-sm font-bold mb-3 text-card-foreground">topup cepat</h4>
        <form onSubmit={handleTopUp} className="space-y-3">
          <input
            type="number"
            value={amount || ""}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Masukkan nominal (e.g. 500)"
            className="w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono"
            required
          />
          {message && <p className="text-xs text-green-500 bg-green-500/10 px-3 py-2 rounded-lg">{message}</p>}
          {errorMsg && <p className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{errorMsg}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 hover:bg-green-600 text-black text-xs font-bold py-2.5 transition disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <><Plus size={14} /> Deposit</>}
          </button>
        </form>
      </div>
    </div>
  );
}