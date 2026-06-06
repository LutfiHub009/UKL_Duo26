"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Folder, Home, Settings, User, ShoppingBag, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  id: "dashboard" | "builds" | "profile" | "settings" | "marketplace";
  label: string;
  href: string;
  icon: LucideIcon;
};

type SidebarProps = {
  activePage?: NavItem["id"];
};

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: Home },
  { id: "builds", label: "My Builds", href: "/buildss", icon: Folder },
  { id: "marketplace", label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { id: "profile", label: "Profile", href: "/profile", icon: User },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ activePage }: SidebarProps) {
  // State untuk menampung data riil dari API backend
  const [userProfile, setUserProfile] = useState<{ username: string; email: string; role?: string } | null>(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user") || localStorage.getItem("profile");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          return {
            username: parsed.username || "",
            email: parsed.email || "",
            role: parsed.role || parsed.roles?.[0] || "",
          };
        } catch (e) {
          console.error(e);
        }
      }
    }
    return null;
  });

  useEffect(() => {
    const fetchProfileFromAPI = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = localStorage.getItem("token");

        // Jika token tidak ada, tidak perlu menembak API
        if (!token) return;

        const res = await fetch(`${baseUrl}/auth/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          const roleVal = data.role || data.roles?.[0] || "";
          
          setUserProfile({
            username: data.username || "User Tracker",
            email: data.email || "user@email.com",
            role: roleVal,
          });
          
          // Opsional: Perbarui juga data di localStorage agar sinkron
          localStorage.setItem("user", JSON.stringify(data));
        } else {
          // Jika token kedaluwarsa atau API gagal, fallback ke localStorage lama jika ada
          const savedUser = localStorage.getItem("user") || localStorage.getItem("profile");
          if (savedUser) {
            const parsed = JSON.parse(savedUser);
            setUserProfile({
              username: parsed.username || "User Tracker",
              email: parsed.email || "user@email.com",
              role: parsed.role || parsed.roles?.[0] || "",
            });
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data profil dari API:", error);
        // Fallback jika offline / server bermasalah
        const savedUser = localStorage.getItem("user") || localStorage.getItem("profile");
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUserProfile({
            username: parsed.username || "User Tracker",
            email: parsed.email || "user@email.com",
            role: parsed.role || parsed.roles?.[0] || "",
          });
        }
      }
    };

    fetchProfileFromAPI();
  }, []);

  const getInitial = (username: string) => {
    return username ? username.charAt(0).toUpperCase() : "U";
  };

  const getDashboardHref = () => {
    const role = (userProfile?.role || "").toLowerCase();
    if (role === "mods") return "/moderator";
    if (role === "customer") return "/customer";
    return "/dashboard";
  };

  return (
    <aside className="w-full md:w-64 bg-background text-foreground transition-all duration-300 border-b border-border md:border-b-0 md:border-r flex flex-col justify-between">
      <div>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-400 rounded-lg" />
          <span className="font-bold text-lg tracking-wide">BuildTracker</span>
        </div>

        <nav className="px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const active = activePage === item.id;
            const Icon = item.icon;
            const href = item.id === "dashboard" ? getDashboardHref() : item.href;

            return (
              <Link
                key={item.id}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                  active
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-gray-400 hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bagian bawah sidebar yang sekarang ditarik langsung dari API */}
      <div className="p-6 border-t border-border flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-black font-black text-sm shadow-sm">
            {getInitial(userProfile?.username || "Loading")}
          </div>
          <div className="overflow-hidden truncate flex-1">
            <p className="text-sm font-semibold text-foreground truncate">
              {userProfile?.username || "Loading..."}
            </p>
            <div className="flex flex-col gap-1 items-start">
              <p className="text-xs text-gray-500 truncate w-full">
                {userProfile?.email || "fetching info..."}
              </p>
              {userProfile?.role && (
                <span className={`inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  userProfile.role.toLowerCase() === "mods"
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : "bg-green-500/10 text-green-500 border border-green-500/20"
                }`}>
                  {userProfile.role.toLowerCase() === "mods" ? "Moderator" : "Customer"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}