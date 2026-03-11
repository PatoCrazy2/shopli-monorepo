import React from 'react';
import { Cloud, CloudOff, CloudUpload, Loader2 } from 'lucide-react';
import { useSync } from '../hooks/useSync';

export function SyncStatusBadge() {
  const { isSyncing, pendingCount } = useSync();
  const isOnline = navigator.onLine;

  let Icon = Cloud;
  let text = "Sincronizado";
  let textColor = "text-emerald-400";
  let animationClass = "";

  if (!isOnline) {
    Icon = CloudOff;
    text = "Sin conexión";
    textColor = "text-rose-400";
  } else if (isSyncing) {
    Icon = Loader2;
    text = "Sincronizando...";
    textColor = "text-emerald-400";
    animationClass = "animate-spin";
  } else if (pendingCount > 0) {
    Icon = CloudUpload;
    text = `${pendingCount} pendiente(s)`;
    textColor = "text-amber-400";
  }

  return (
    <div 
      className={`flex items-center gap-2 bg-zinc-900/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-zinc-800 ${textColor} text-sm font-medium transition-colors`}
      title={isOnline ? "Conectado al servidor" : "Operando en modo Local Offline"}
    >
      <Icon size={16} className={animationClass} />
      <span>{text}</span>
    </div>
  );
}
