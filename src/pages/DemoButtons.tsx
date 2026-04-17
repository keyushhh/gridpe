import React, { useState } from "react";
import { LiquidGlassButton } from "@/labs/LiquidGlassButton";
import { ChevronRight, CreditCard, Wallet, Sun, Moon, Grid3X3, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";

export default function DemoButtons() {
  const { theme, setTheme } = useTheme();
  const [bgType, setBgType] = useState<'grid' | 'gradient' | 'text'>('text');

  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500 p-8 flex flex-col items-center justify-center gap-12 overflow-hidden relative font-['Satoshi']",
      isDark ? "bg-[#050505] text-white" : "bg-[#f8f9fa] text-slate-900"
    )}>
      {/* Dynamic Background Patterns for Refraction Testing */}
      {bgType === 'grid' && (
        <div className="absolute inset-0 z-0 opacity-[0.08] dark:opacity-20"
          style={{ backgroundImage: `radial-gradient(${isDark ? '#ffffff' : '#000000'} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      )}

      {bgType === 'gradient' && (
        <>
          <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        </>
      )}

      {bgType === 'text' && (
        <div className="absolute inset-0 pointer-events-none flex flex-wrap gap-12 opacity-[0.03] dark:opacity-[0.05] text-8xl font-black select-none uppercase items-center justify-center overflow-hidden leading-none">
          {Array.from({ length: 40 }).map((_, i) => (
            <span key={i}>Refraction Control Lens Glass Liquid</span>
          ))}
        </div>
      )}

      {/* Floating Controls */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl">
          <Sun className="w-4 h-4 opacity-50" />
          <Switch
            checked={isDark}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          />
          <Moon className="w-4 h-4 opacity-50" />
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl self-end">
          <button onClick={() => setBgType('text')} className={cn("p-2 rounded-lg transition-colors", bgType === 'text' ? "bg-white/20" : "hover:bg-white/10")}>
            <Palette className="w-4 h-4" />
          </button>
          <button onClick={() => setBgType('grid')} className={cn("p-2 rounded-lg transition-colors", bgType === 'grid' ? "bg-white/20" : "hover:bg-white/10")}>
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="z-10 text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tighter bg-gradient-to-b from-foreground to-foreground/40 bg-clip-text text-transparent italic">
          Advanced Refraction
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-sm leading-relaxed">
          Testing dynamic displacement in {isDark ? 'Dark' : 'Light'} Mode. Watch how the {bgType} warps at the edges.
        </p>
      </div>

      <div className="z-10 flex flex-col items-center gap-10 w-full max-w-sm">
        <div className="w-full space-y-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-blue-500/80 font-bold text-center">Master Component</p>
          <LiquidGlassButton className="w-full h-14 rounded-2xl text-lg group">
            <span className="group-hover:translate-x-1 transition-transform flex items-center gap-2">
              Launch Application <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </span>
          </LiquidGlassButton>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <LiquidGlassButton className="h-14 rounded-2xl px-2">
            <CreditCard className="w-5 h-5 opacity-70" />
            <span className="text-sm">Payments</span>
          </LiquidGlassButton>
          <LiquidGlassButton className="h-14 rounded-2xl px-2">
            <Wallet className="w-5 h-5 opacity-70" />
            <span className="text-sm">Wallet</span>
          </LiquidGlassButton>
        </div>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
