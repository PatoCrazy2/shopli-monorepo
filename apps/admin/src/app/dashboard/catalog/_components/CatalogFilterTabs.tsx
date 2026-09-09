"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Package, PackageCheck, PackageX } from "lucide-react";

interface CatalogFilterTabsProps {
  counts: {
    active: number;
    inactive: number;
    total: number;
  };
}

export function CatalogFilterTabs({ counts }: CatalogFilterTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentTab = searchParams.get("tab") || "active";

  const handleTabChange = (tab: "active" | "inactive" | "all") => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page"); // Reset a página 1 al cambiar de pestaña

    if (tab === "active") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }

    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const tabs = [
    {
      id: "active" as const,
      label: "Activos",
      count: counts.active,
      icon: PackageCheck,
      badgeClass:
        currentTab === "active"
          ? "bg-black text-white dark:bg-white dark:text-black"
          : "bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200",
    },
    {
      id: "inactive" as const,
      label: "Inactivos",
      count: counts.inactive,
      icon: PackageX,
      badgeClass:
        currentTab === "inactive"
          ? "bg-black text-white dark:bg-white dark:text-black"
          : "bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200",
    },
    {
      id: "all" as const,
      label: "Todos",
      count: counts.total,
      icon: Package,
      badgeClass:
        currentTab === "all"
          ? "bg-black text-white dark:bg-white dark:text-black"
          : "bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200",
    },
  ];

  return (
    <div className="flex w-full sm:w-auto p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-opacity">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            disabled={isPending}
            className={`group relative flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 shrink-0 hidden xs:block sm:block ${isActive ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`} />
            <span>{tab.label}</span>
            <span
              className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] rounded-full font-medium transition-colors ${tab.badgeClass}`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
