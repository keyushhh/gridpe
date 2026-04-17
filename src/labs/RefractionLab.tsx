import React from "react";
import { LiquidGlassController } from "./LiquidGlassController";
import { Sparkles, FlaskConical, Github } from "lucide-react";

export default function RefractionLab() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#050505] dark:text-white transition-colors duration-500 selection:bg-primary/30">
      {/* Visual background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-black/5 dark:border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold tracking-tight text-lg">Grid.Pe Lab</span>
        </div>
        
        <div className="flex items-center gap-6">
          <a href="#" className="text-sm text-slate-500 dark:text-muted-foreground hover:text-primary transition-colors">Documentation</a>
          <div className="h-4 w-px bg-black/10 dark:bg-white/10" />
          <Github className="w-5 h-5 text-slate-500 dark:text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
        </div>
      </nav>

      <main className="relative z-10 container max-w-7xl mx-auto px-6 py-12 space-y-12">
        <header className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            V3.0 Refraction Engine
          </div>
          <h1 className="text-5xl lg:text-6xl font-black tracking-tighter leading-none">
            Liquid Glass <br /> <span className="text-muted-foreground">Experiment.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Fine-tune the "Clear Thick Lens" refraction parameters for the Grid.Pe design system. 
            Adjust the sliders to simulate glass thickness, lighting, and background warping.
          </p>
        </header>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <LiquidGlassController />
        </section>

        <footer className="pt-24 pb-12 text-center text-sm text-muted-foreground">
          <p>© 2026 Grid.Pe Creative Engineering Lab. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
