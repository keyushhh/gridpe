import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";

export interface LiquidGlassProps extends ButtonProps {
  specularIntensity?: number;
  specularAngle?: number;
  refractionScale?: number;
  backdropBlur?: number;
  tintOpacity?: number;
  tintColor?: string; // Hex or CSS color
  isClearMode?: boolean; // New prop for pure physics
}

const LiquidGlassButton = React.forwardRef<HTMLButtonElement, LiquidGlassProps>(
  ({ 
    className, 
    variant, 
    size, 
    children, 
    specularIntensity, 
    specularAngle,
    refractionScale,
    backdropBlur,
    tintOpacity,
    tintColor,
    isClearMode = false,
    ...props 
  }, ref) => {
    const filterId = React.useId().replace(/:/g, "");
    
    // 1. Resolve values from props or CSS variables
    const sIntensity = specularIntensity ?? "var(--glass-specular-intensity, 0.6)";
    const sAngle = specularAngle ?? "var(--glass-specular-angle, 135)";
    const rScale = refractionScale ?? "var(--glass-refraction, 60)";
    const bBlur = backdropBlur ?? "var(--glass-blur, 20)";
    const tOpacity = isClearMode ? 0 : (tintOpacity ?? "var(--glass-tint-opacity, 0.75)");
    const tColor = tintColor ?? "var(--glass-tint-color, 255, 255, 255)";

    // Calculate rad and gradient positions for the Contour Stroke
    const displayAngle = typeof sAngle === 'number' ? sAngle : 135;
    const rad = (displayAngle * Math.PI) / 180;
    const x1 = 0.5 - 0.5 * Math.cos(rad);
    const y1 = 0.5 - 0.5 * Math.sin(rad);
    const x2 = 0.5 + 0.5 * Math.cos(rad);
    const y2 = 0.5 + 0.5 * Math.sin(rad);

    const bezelTableValues = "0 0.4 0.8 1 1 1 1 1 1 1 1";

    // Handle tint color format
    const getBackgroundStyle = () => {
      if (isClearMode) {
        return {
          backgroundColor: 'transparent',
          backdropFilter: `url(#refraction-${filterId}) blur(calc(${bBlur} * 1px)) saturate(1.8)`,
          WebkitBackdropFilter: `url(#refraction-${filterId}) blur(calc(${bBlur} * 1px)) saturate(1.8)`
        };
      }

      if (!tintColor && !tintOpacity) {
        return {
          backgroundColor: 'var(--glass-tint, rgba(255, 255, 255, 0.75))',
          backdropFilter: `url(#refraction-${filterId}) blur(calc(${bBlur} * 1px)) saturate(1.8)`,
          WebkitBackdropFilter: `url(#refraction-${filterId}) blur(calc(${bBlur} * 1px)) saturate(1.8)`
        };
      }

      let colorValue = tColor as string;
      if (colorValue.startsWith('#')) {
        const r = parseInt(colorValue.slice(1, 3), 16);
        const g = parseInt(colorValue.slice(3, 5), 16);
        const b = parseInt(colorValue.slice(5, 7), 16);
        colorValue = `${r}, ${g}, ${b}`;
      }
      
      return {
        backgroundColor: colorValue.includes(',') ? `rgba(${colorValue}, ${tOpacity})` : colorValue,
        backdropFilter: `url(#refraction-${filterId}) blur(calc(${bBlur} * 1px)) saturate(1.8)`,
        WebkitBackdropFilter: `url(#refraction-${filterId}) blur(calc(${bBlur} * 1px)) saturate(1.8)`
      };
    };

    return (
        <Button
          ref={ref}
          variant={variant}
          size={size}
          className={cn(
            "relative overflow-hidden transition-all duration-300 group",
            "text-foreground",
            "border border-black/[0.08] dark:border-white/10",
            "shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]",
            className
          )}
          style={getBackgroundStyle() as React.CSSProperties}
          {...props}
        >
          {/* SVG definitions and specular layer */}
          <svg 
            style={{ position: "absolute", width: "100%", height: "100%", inset: 0, pointerEvents: "none", overflow: 'visible' }} 
            aria-hidden="true"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`rim-gradient-${filterId}`} x1={x1} y1={y1} x2={x2} y2={y2}>
                <stop offset="0%" stopColor="white" stopOpacity={typeof sIntensity === 'number' ? sIntensity : 0.6} />
                <stop offset="20%" stopColor="white" stopOpacity="0" />
                <stop offset="80%" stopColor="white" stopOpacity="0" />
                <stop offset="100%" stopColor="white" stopOpacity={(typeof sIntensity === 'number' ? sIntensity : 0.6) * 0.5} />
              </linearGradient>

              <filter id={`refraction-${filterId}`} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB" primitiveUnits="objectBoundingBox">
                <feGaussianBlur in="SourceAlpha" stdDeviation="0.01" result="blur" />
                <feComponentTransfer in="blur" result="bezel">
                  <feFuncA type="table" tableValues={bezelTableValues} />
                </feComponentTransfer>
                
                <feConvolveMatrix in="bezel" order="3" kernelMatrix="-1 0 1 -2 0 2 -1 0 1" result="gradX" />
                <feConvolveMatrix in="bezel" order="3" kernelMatrix="-1 -2 -1 0 0 0 1 2 1" result="gradY" />
                
                <feColorMatrix in="gradX" type="matrix" values="0.125 0 0 0 0.5 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />
                <feColorMatrix in="gradY" type="matrix" values="0 0 0 0 0 0 0.125 0 0 0.5 0 0 0 0 0 0 0 0  green" result="green" />
                <feComposite in="red" in2="green" operator="arithmetic" k2="1" k3="1" result="displacementMap" />
                
                <feDisplacementMap 
                  in="SourceGraphic" 
                  in2="displacementMap" 
                  scale={typeof rScale === 'number' ? rScale / 100 : 0.6} 
                  xChannelSelector="R" 
                  yChannelSelector="G" 
                  result="refracted" 
                />
                
                <feComposite in="refracted" in2="SourceAlpha" operator="in" result="masked" />
                <feColorMatrix in="masked" type="saturate" values="1.3" result="saturated" />
                
                <feComponentTransfer in="saturated">
                  <feFuncR type="linear" slope="1.05" />
                  <feFuncG type="linear" slope="1.05" />
                  <feFuncB type="linear" slope="1.05" />
                </feComponentTransfer>
              </filter>
            </defs>

            {/* Contour Stroke Specular Layer - Sharp 1px for Clear Mode */}
            <rect 
              x="0.5" y="0.5" width="calc(100% - 1px)" height="calc(100% - 1px)" 
              rx="16" ry="16"
              fill="none" 
              stroke={`url(#rim-gradient-${filterId})`} 
              strokeWidth={isClearMode ? "1" : "1.5"}
              style={{ mixBlendMode: 'screen' }}
            />
          </svg>

          {/* Inner Glow Edge */}
          <span className="absolute inset-0 pointer-events-none rounded-inherit shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]" />
          
          <span className="relative z-10 flex items-center justify-center gap-2 font-medium tracking-tight">
            {children}
          </span>
        </Button>
    );
  }
);

LiquidGlassButton.displayName = "LiquidGlassButton";

export { LiquidGlassButton };
