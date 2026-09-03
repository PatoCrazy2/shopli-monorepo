import React from "react";
import Link from "next/link";
import { Lock, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

interface UpgradeGateBannerProps {
  title: string;
  description: string;
  featureList: string[];
  requiredPlanName?: string;
}

export function UpgradeGateBanner({
  title,
  description,
  featureList,
  requiredPlanName = "Plan Crecimiento",
}: UpgradeGateBannerProps) {
  return (
    <div className="max-w-4xl mx-auto my-12 animate-in fade-in duration-300">
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 sm:p-12 shadow-xl">
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-bl from-amber-400/20 via-yellow-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-gradient-to-tr from-zinc-400/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto space-y-6">
          {/* Badge & Icon */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 tracking-wide uppercase shadow-sm">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            Disponible en {requiredPlanName}
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
              {title}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base leading-relaxed">
              {description}
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left pt-2">
            {featureList.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="pt-4 w-full flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard/billing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white font-bold text-sm transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-600" />
              Actualizar a {requiredPlanName}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
