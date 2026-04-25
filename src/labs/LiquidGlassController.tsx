import React, { useState, useRef } from "react";
import { LiquidGlassButton } from "./LiquidGlassButton";
import { 
  ChevronRight, 
  Sun, 
  Moon, 
  Copy, 
  Check, 
  Save, 
  Upload, 
  Image as ImageIcon, 
  X,
  Palette,
  Droplets,
  Box
} from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const COLOR_PRESETS = [
  { name: "Sky", color: "#ffffff", label: "Clear" },
  { name: "Grid.Pe Green", color: "#22C55E", label: "Green" },
  { name: "Grid.Pe Yellow", color: "#F7E31D", label: "Yellow" },
  { name: "Premium Blue", color: "#3b82f6", label: "Blue" },
  { name: "Grid.Pe Gold", color: "#FAB005", label: "Gold" },
  { name: "Hot Ruby", color: "#ef4444", label: "Red" },
];

export function LiquidGlassController() {
  const { resolvedTheme, setTheme } = useTheme();
  const [isClearMode, setIsClearMode] = useState(true); // Default to Clear Mode for "Liquid" focus
  const [config, setConfig] = useState({
    specularIntensity: 0.6,
    specularAngle: 135,
    refractionScale: 80, // Boosted for Clear Mode
    backdropBlur: 20, 
    tintOpacity: 0.75, 
    tintColor: "#22C55E",
  });
  const [bgType, setBgType] = useState<'grid' | 'image'>('grid');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = resolvedTheme !== 'light';

  const getRgbFromHex = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  const getHexAlpha = (hex: string, opacity: number) => {
    const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
    return `${hex}${alpha}`.toUpperCase();
  };

  const generateCssVariables = () => {
    const selector = isDark ? ".dark" : ":root";
    const header = isClearMode 
      ? `/* Grid.Pe Pure Physics Glass (${isDark ? 'Dark Mode' : 'Light Mode'}) */`
      : `/* Grid.Pe Liquid Glass Tokens (${isDark ? 'Dark Mode' : 'Light Mode'}) */`;

    if (isClearMode) {
      return `${selector} {
  ${header}
  --glass-refraction: ${config.refractionScale};
  --glass-blur: ${config.backdropBlur}px;
  --glass-specular-intensity: ${config.specularIntensity};
  --glass-specular-angle: ${config.specularAngle}deg;
  --glass-tint: transparent;
}`;
    }

    const hex8 = getHexAlpha(config.tintColor, config.tintOpacity);
    return `${selector} {
  ${header}
  --glass-refraction: ${config.refractionScale};
  --glass-blur: ${config.backdropBlur}px;
  --glass-tint: ${hex8}; 
  --glass-tint-rgb: ${getRgbFromHex(config.tintColor)};
  --glass-tint-opacity: ${config.tintOpacity};
  --glass-specular-intensity: ${config.specularIntensity};
  --glass-specular-angle: ${config.specularAngle}deg;
}`;
  };

  const handleCopy = () => {
    const json = JSON.stringify({
      isClearMode,
      ...config,
      hexAlpha: isClearMode ? "transparent" : getHexAlpha(config.tintColor, config.tintOpacity)
    }, null, 2);
    const css = generateCssVariables();
    const typeLabel = isClearMode ? "Pure Physics" : "High-Density";
    const fullText = `/* Grid.Pe ${typeLabel} Glass Configuration */\n\n/* JSON State */\n${json}\n\n/* CSS Variables (Paste into globals.css) */\n${css}`;
    
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success(`${typeLabel} config copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImage(reader.result as string);
        setBgType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl mx-auto p-6 bg-white/5 dark:bg-black/20 rounded-[3rem] border border-black/5 dark:border-white/10 backdrop-blur-3xl shadow-2xl transition-all duration-500">
      {/* 1. Preview Area */}
      <div 
        className={cn(
          "flex-1 flex flex-col items-center justify-center p-12 rounded-[2.5rem] relative overflow-hidden transition-all duration-500 shadow-inner border border-black/5 dark:border-white/5",
          isDark ? "bg-[#050505]" : "bg-[#f8f9fa]"
        )}
      >
        
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          {bgType === 'grid' ? (
            <div className="absolute inset-0 flex flex-wrap gap-6 opacity-[0.08] dark:opacity-[0.14] text-5xl font-black select-none uppercase items-center justify-center overflow-hidden leading-none tracking-tighter">
              {Array.from({ length: 120 }).map((_, i) => (
                <span key={i} className="rotate-[-5deg]">Grid.Pe Glass Lens Warp</span>
              ))}
            </div>
          ) : (
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700" 
              style={{ backgroundImage: customImage ? `url(${customImage})` : 'none' }}
            >
              {!customImage && (
                <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
                  <ImageIcon className="w-5 h-5 animate-pulse" />
                  <span>Drop UI asset here</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="z-10 w-full max-w-xs space-y-6">
          <LiquidGlassButton 
            className="w-full h-18 rounded-3xl text-xl font-bold tracking-tight shadow-xl"
            isClearMode={isClearMode}
            {...config}
          >
            Preview Button <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </LiquidGlassButton>
        </div>

        {/* Floating Context Toolbar */}
        <div className="absolute top-8 right-8 flex flex-col gap-4">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-black/60 backdrop-blur-xl border border-black/10 dark:border-white/20 shadow-2xl transition-all">
            <Sun className={cn("w-3.5 h-3.5 transition-colors", isDark ? "text-muted-foreground" : "text-amber-500")} />
            <Switch 
              checked={isDark} 
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} 
              className="data-[state=checked]:bg-primary"
            />
            <Moon className={cn("w-3.5 h-3.5 transition-colors", isDark ? "text-blue-400" : "text-muted-foreground")} />
          </div>

          <div className="flex items-center gap-2 px-2 py-2 rounded-2xl bg-white dark:bg-black/60 backdrop-blur-xl border border-black/10 dark:border-white/20 shadow-2xl transition-all">
            <button 
              onClick={() => setBgType('grid')}
              className={cn(
                "flex-1 p-2.5 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest",
                bgType === 'grid' ? "bg-primary text-white shadow-lg" : "hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
              )}
            >
              Grid
            </button>
            <button 
              onClick={() => {
                if (customImage) setBgType('image');
                else fileInputRef.current?.click();
              }}
              className={cn(
                "flex-1 p-2.5 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest relative overflow-hidden",
                bgType === 'image' ? "bg-primary text-white shadow-lg" : "hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
              )}
            >
              {customImage ? "Asset" : "Upload"}
              {customImage && bgType === 'image' && (
                <X className="absolute top-1 right-1 w-2.5 h-2.5 hover:text-red-400" onClick={(e) => {
                  e.stopPropagation();
                  setCustomImage(null);
                  setBgType('grid');
                }} />
              )}
            </button>
          </div>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleImageUpload} 
        />
      </div>

      {/* 2. Designer Controls Area */}
      <div className="w-full lg:w-[420px] flex flex-col gap-8 p-3">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
              Grid.Pe Labs
            </div>
            <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5">
              <Droplets className={cn("w-3.5 h-3.5 transition-colors", isClearMode ? "text-primary" : "text-muted-foreground")} />
              <span className="text-[9px] font-bold uppercase tracking-tight">Crystal Clear</span>
              <Switch checked={isClearMode} onCheckedChange={setIsClearMode} />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tighter leading-tight">Lens Refinement</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isClearMode 
                ? "Crystal Clear Mode active. High-fidelity liquid physics are prioritized."
                : "High-density refraction engine with Solid Alpha optics and saturation control."}
            </p>
          </div>
        </div>

        <div className={cn("space-y-8 transition-all", isClearMode && "opacity-60 pointer-events-none")}>
          {/* Tint Color Section */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <Palette className="w-3.5 h-3.5" />
                Color Foundations
              </div>
              {!isClearMode && <span className="text-[10px] font-mono opacity-40">{getHexAlpha(config.tintColor, config.tintOpacity)}</span>}
            </div>
            <div className="grid grid-cols-6 gap-2.5">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setConfig({ ...config, tintColor: preset.color })}
                  className={cn(
                    "group relative aspect-square rounded-2xl border-2 transition-all hover:scale-110 active:scale-95 flex items-center justify-center overflow-hidden",
                    config.tintColor === preset.color ? "border-primary shadow-xl shadow-primary/10" : "border-transparent bg-black/5 dark:bg-white/5"
                  )}
                  title={preset.name}
                >
                  <div 
                    className="w-full h-full" 
                    style={{ backgroundColor: preset.color }}
                  />
                  {config.tintColor === preset.color && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
              <div className="relative aspect-square">
                <input 
                  type="color" 
                  value={config.tintColor}
                  onChange={(e) => setConfig({ ...config, tintColor: e.target.value })}
                  className="w-full h-full opacity-0 cursor-pointer"
                />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center border-2 border-dashed border-black/20 dark:border-white/20 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <Palette className="w-4 h-4 opacity-40" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <ControlSlider 
            label="Refraction Scale" 
            value={config.refractionScale} 
            min={0} max={250} 
            onChange={(v) => setConfig({...config, refractionScale: v})}
          />

          <ControlSlider 
            label="Backdrop Blur" 
            value={config.backdropBlur} 
            min={0} max={64} 
            onChange={(v) => setConfig({...config, backdropBlur: v})}
          />

          <div className={cn("transition-opacity", isClearMode && "opacity-30")}>
            <ControlSlider 
              label="Tint Opacity" 
              value={config.tintOpacity} 
              min={0.7} max={0.9} step={0.01}
              onChange={(v) => setConfig({...config, tintOpacity: v})}
            />
          </div>

          <ControlSlider 
            label="Specular Intensity" 
            value={config.specularIntensity} 
            min={0} max={1} step={0.05}
            onChange={(v) => setConfig({...config, specularIntensity: v})}
          />

          <ControlSlider 
            label="Specular Angle" 
            value={config.specularAngle} 
            min={0} max={360} 
            onChange={(v) => setConfig({...config, specularAngle: v})}
          />
        </div>

        <div className="pt-6 flex flex-col gap-3">
          <button 
            onClick={handleCopy}
            className="flex items-center justify-center gap-3 h-14 rounded-[1.25rem] bg-primary text-white font-black uppercase tracking-widest text-[11px] transition-all hover:brightness-110 active:scale-[0.98] shadow-2xl shadow-primary/30"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Config Copied" : "Copy Config (JSON + CSS)"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ControlSlider({ label, value, min, max, step = 1, onChange }: { 
  label: string, 
  value: number, 
  min: number, 
  max: number, 
  step?: number,
  onChange: (v: number) => void 
}) {
  return (
    <div className="space-y-3.5 group">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground group-hover:text-foreground transition-colors">{label}</label>
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg tabular-nums border border-black/5 dark:border-white/5">{value}</span>
        </div>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
      />
    </div>
  );
}
