"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Users, UserCheck, UserX } from "lucide-react";

interface UserFilterTabsProps {
  counts: {
    active: number;
    inactive: number;
    total: number;
  };
}

export function UserFilterTabs({ counts }: UserFilterTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentTab = searchParams.get("tab") || "active";

  const handleTabChange = (tab: "active" | "inactive" | "all") => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "active") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }

    startTransition(() => {
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    });
  };

  const tabs = [
    {
      id: "active" as const,
      label: "Activos",
      count: counts.active,
      icon: UserCheck,
      badgeClass:
        currentTab === "active"
          ? "bg-black text-white dark:bg-white dark:text-black"
          : "bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200",
    },
    {
      id: "inactive" as const,
      label: "Inactivos",
      count: counts.inactive,
      icon: UserX,
      badgeClass:
        currentTab === "inactive"
          ? "bg-black text-white dark:bg-white dark:text-black"
          : "bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200",
    },
    {
      id: "all" as const,
      label: "Todos",
      count: counts.total,
      icon: Users,
      badgeClass:
        currentTab === "all"
          ? "bg-black text-white dark:bg-white dark:text-black"
          : "bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200",
    },
  ];

  return (
    <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-opacity">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            disabled={isPending}
            className={`group relative flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`} />
            <span>{tab.label}</span>
            <span
              className={`ml-0.5 px-2 py-0.5 text-[11px] rounded-full font-medium transition-colors ${tab.badgeClass}`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
