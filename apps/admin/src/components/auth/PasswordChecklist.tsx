"use client";

import { Check, Circle } from "lucide-react";
import { checkPasswordRules } from "@/lib/validators/auth";

interface PasswordChecklistProps {
  password: string;
}

export function PasswordChecklist({ password }: PasswordChecklistProps) {
  const rules = checkPasswordRules(password);

  const items = [
    { label: "Al menos 8 caracteres", met: rules.hasMinLength },
    { label: "Al menos un número (0-9)", met: rules.hasNumber },
    { label: "Al menos una letra", met: rules.hasLetter },
  ];

  return (
    <div className="space-y-1.5 pt-1 text-xs">
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`flex items-center gap-2 transition-colors duration-200 ${
            item.met ? "text-emerald-400 font-medium" : "text-neutral-400"
          }`}
        >
          {item.met ? (
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 text-emerald-400" />
            </div>
          ) : (
            <div className="w-4 h-4 flex items-center justify-center shrink-0">
              <Circle className="w-2.5 h-2.5 text-neutral-400" />
            </div>
          )}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
