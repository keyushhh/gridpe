import { useEffect, useState } from 'react';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const readEnvInset = (name: string): number => {
  if (typeof window === 'undefined') return 0;
  const probe = document.createElement('div');
  probe.style.position = 'fixed';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.height = `env(${name}, 0px)`;
  document.body.appendChild(probe);
  const value = parseInt(getComputedStyle(probe).height, 10) || 0;
  document.body.removeChild(probe);
  return value;
};

const computeInsets = (): SafeAreaInsets => ({
  top: readEnvInset('safe-area-inset-top'),
  bottom: readEnvInset('safe-area-inset-bottom'),
  left: readEnvInset('safe-area-inset-left'),
  right: readEnvInset('safe-area-inset-right'),
});

export const useSafeArea = (): SafeAreaInsets => {
  const [insets, setInsets] = useState<SafeAreaInsets>(() => computeInsets());

  useEffect(() => {
    const update = () => {
      const newInsets = computeInsets();
      setInsets(newInsets);
      // Optional debug logging to verify the plugin's polyfill is working
      console.log('Safe Area Insets (env polyfill):', newInsets);
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return insets;
};
