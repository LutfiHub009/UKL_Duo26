"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[]; // e.g. ["customer", "mods"]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.replace("/login");
          return;
        }

        let userRole = "";
        const savedUser = localStorage.getItem("user") || localStorage.getItem("profile");
        
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            userRole = parsed.role || parsed.roles?.[0] || "";
          } catch (e) {
            console.error("Error parsing user profile from localStorage:", e);
          }
        }

        // Jika profile tidak ada di localStorage, ambil dari API
        if (!userRole) {
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
          const res = await fetch(`${baseUrl}/auth/profile`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (res.ok) {
            const data = await res.json();
            userRole = data.role || data.roles?.[0] || "";
            localStorage.setItem("user", JSON.stringify(data));
          } else {
            // Token tidak valid atau API error, hapus token dan kirim ke login
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.replace("/login");
            return;
          }
        }

        const normalizedRole = userRole.toLowerCase();
        const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

        if (normalizedAllowed.includes(normalizedRole)) {
          setIsAuthorized(true);
        } else {
          // Redirect ke dashboard yang sesuai jika role tidak cocok
          if (normalizedRole === "mods") {
            router.replace("/moderator");
          } else {
            router.replace("/customer");
          }
        }
      } catch (err) {
        console.error("Error checking role authorization:", err);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [router, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-2">
        <Loader2 className="animate-spin text-green-500" size={32} />
        <p className="text-xs text-muted-foreground">Verifying access role...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
