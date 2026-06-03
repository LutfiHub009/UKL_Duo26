import Link from "next/link";
import { Folder, Home, Settings, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  id: "dashboard" | "builds" | "profile" | "settings";
  label: string;
  href: string;
  icon: LucideIcon;
};

type SidebarProps = {
  activePage?: NavItem["id"];
};

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: Home },
  { id: "builds", label: "All Builds", href: "/buildss", icon: Folder },
  { id: "profile", label: "Profile", href: "/profile", icon: User },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ activePage }: SidebarProps) {
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

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-400 hover:text-foreground"
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-border flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-red-500" />
          <div>
            <p className="text-sm font-semibold">John Doe</p>
            <p className="text-xs text-gray-500">john@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
