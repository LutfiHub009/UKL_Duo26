"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/login");
      } else {
        setIsReady(true);
      }
    };

    checkToken();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "token" && event.newValue === null) {
        router.replace("/login");
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [router]);

  if (!isReady) {
    return <div className="min-h-screen flex items-center justify-center">Checking authentication...</div>;
  }

  return <>{children}</>;
}
