import * as React from "react";

/**
 * Global SVG Filter definitions for the Liquid Glass refraction engine.
 * Including this once at the root of the app (App.tsx) allows any component
 * to use 'filter: url(#liquid-glass-physics)'.
 */
export const LiquidGlassFilters = () => {
  const bezelTableValues = "0 0.4 0.8 1 1 1 1 1 1 1 1";
  
  return (
    <svg 
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none", opacity: 0 }} 
      aria-hidden="true"
    >
      <defs>
        <filter 
          id="liquid-glass-physics" 
          x="-50%" y="-50%" width="200%" height="200%" 
          colorInterpolationFilters="sRGB" 
          filterUnits="userSpaceOnUse"
          primitiveUnits="userSpaceOnUse"
        >
          {/* 1. Extract Surface Topology (Bezel) */}
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
          <feComponentTransfer in="blur" result="bezel">
            <feFuncA type="table" tableValues={bezelTableValues} />
          </feComponentTransfer>
          
          {/* 2. Calculate Surface Gradients (Normal Map) */}
          <feConvolveMatrix in="bezel" order="3" kernelMatrix="-1 0 1 -2 0 2 -1 0 1" result="gradX" />
          <feConvolveMatrix in="bezel" order="3" kernelMatrix="-1 -2 -1 0 0 0 1 2 1" result="gradY" />
          
          {/* 3. Convert Gradients to Displacement mapping */}
          <feColorMatrix in="gradX" type="matrix" values="0.125 0 0 0 0.5 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />
          <feColorMatrix in="gradY" type="matrix" values="0 0 0 0 0 0 0.125 0 0 0.5 0 0 0 0 0 0 0 0 1 0" result="green" />
          <feComposite in="red" in2="green" operator="arithmetic" k2="1" k3="1" result="displacementMap" />
          
          {/* 4. Apply Refraction Warp */}
          {/* Note: The scale is controlled by CSS/Props via feDisplacementMap filter attributes if we were using it in-component, 
              but since it's global, we use a standard clear-physics scale (0.8). */}
          <feDisplacementMap 
            in="SourceGraphic" 
            in2="displacementMap" 
            scale="15" 
            xChannelSelector="R" 
            yChannelSelector="G" 
            result="refracted" 
          />
          
          {/* 5. Cleanup & Polish */}
          <feComposite in="refracted" in2="SourceAlpha" operator="in" result="masked" />
          <feColorMatrix in="masked" type="saturate" values="1.8" result="final" />
        </filter>

        {/* 2. Scoped High-Density Refraction (Physics Scale 45) */}
        <filter 
          id="liquid-glass-physics-search" 
          x="-50%" y="-50%" width="200%" height="200%" 
          colorInterpolationFilters="sRGB" 
          filterUnits="userSpaceOnUse"
          primitiveUnits="userSpaceOnUse"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
          <feComponentTransfer in="blur" result="bezel">
            <feFuncA type="table" tableValues={bezelTableValues} />
          </feComponentTransfer>
          
          <feConvolveMatrix in="bezel" order="3" kernelMatrix="-1 0 1 -2 0 2 -1 0 1" result="gradX" />
          <feConvolveMatrix in="bezel" order="3" kernelMatrix="-1 -2 -1 0 0 0 1 2 1" result="gradY" />
          
          <feColorMatrix in="gradX" type="matrix" values="0.125 0 0 0 0.5 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />
          <feColorMatrix in="gradY" type="matrix" values="0 0 0 0 0 0 0.125 0 0 0.5 0 0 0 0 0 0 0 0 1 0" result="green" />
          <feComposite in="red" in2="green" operator="arithmetic" k2="1" k3="1" result="displacementMap" />
          
          <feDisplacementMap 
            in="SourceGraphic" 
            in2="displacementMap" 
            scale="45" 
            xChannelSelector="R" 
            yChannelSelector="G" 
            result="refracted" 
          />
          
          <feComposite in="refracted" in2="SourceAlpha" operator="in" result="masked" />
          <feColorMatrix in="masked" type="saturate" values="2.0" result="final" />
        </filter>
      </defs>
    </svg>
  );
};
