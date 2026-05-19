import { ASSETS } from '@/constants/assets';
import React from 'react';
interface KeypadProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  isDarkMode: boolean;
  disabled?: boolean;
}
const KeypadButton = ({
  label,
  onClick,
  icon,
  disabled,
  isDarkMode,
}: {
  label?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  isDarkMode: boolean;
}) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={`w-[113px] h-[65px] rounded-xl flex items-center justify-center active:bg-brand-primary active:text-white transition-colors group shadow-sm ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    } ${
      disabled ? `opacity-20 cursor-not-allowed ${isDarkMode ? 'active:bg-black active:text-white' : 'active:bg-[#F4F4F4] active:text-black'}` : ''
    }`}
  >
    {icon ? (
      <div className={disabled ? '' : 'group-active:brightness-200'}>
        {React.isValidElement(icon)
          ? React.cloneElement(
              icon as React.ReactElement,
              {
                style: { filter: disabled ? 'none' : isDarkMode ? 'brightness(0) saturate(100%) invert(1)' : 'brightness(0)' },
                className: `${(icon as React.ReactElement).props.className || ''} ${disabled ? '' : 'group-active:filter-none'}`,
              } as React.HTMLAttributes<HTMLElement>
            )
          : icon}
      </div>
    ) : (
      <span
        className={`font-bold font-sans text-[32px] ${disabled ? (isDarkMode ? 'text-white/20' : 'text-black/20') : (isDarkMode ? 'group-active:text-white text-white' : 'group-active:text-white text-black')}`}
      >
        {label}
      </span>
    )}
  </button>
);
const Keypad: React.FC<KeypadProps> = ({ onKeyPress, onBackspace, isDarkMode, disabled }) => {
  return (
    <div className="flex flex-col gap-[10px] items-center relative z-10">
      {/* Row 1 */}
      <div className="flex gap-[10px]">
        <KeypadButton label="1" onClick={() => onKeyPress('1')} disabled={disabled} isDarkMode={isDarkMode} />
        <KeypadButton label="2" onClick={() => onKeyPress('2')} disabled={disabled} isDarkMode={isDarkMode} />
        <KeypadButton label="3" onClick={() => onKeyPress('3')} disabled={disabled} isDarkMode={isDarkMode} />
      </div>
      {/* Row 2 */}
      <div className="flex gap-[10px]">
        <KeypadButton label="4" onClick={() => onKeyPress('4')} disabled={disabled} isDarkMode={isDarkMode} />
        <KeypadButton label="5" onClick={() => onKeyPress('5')} disabled={disabled} isDarkMode={isDarkMode} />
        <KeypadButton label="6" onClick={() => onKeyPress('6')} disabled={disabled} isDarkMode={isDarkMode} />
      </div>
      {/* Row 3 */}
      <div className="flex gap-[10px]">
        <KeypadButton label="7" onClick={() => onKeyPress('7')} disabled={disabled} isDarkMode={isDarkMode} />
        <KeypadButton label="8" onClick={() => onKeyPress('8')} disabled={disabled} isDarkMode={isDarkMode} />
        <KeypadButton label="9" onClick={() => onKeyPress('9')} disabled={disabled} isDarkMode={isDarkMode} />
      </div>
      {/* Row 4 */}
      <div className="flex gap-[10px]">
        <KeypadButton label="." onClick={() => onKeyPress('.')} disabled={disabled} isDarkMode={isDarkMode} />
        <KeypadButton label="0" onClick={() => onKeyPress('0')} disabled={disabled} isDarkMode={isDarkMode} />
        <KeypadButton
          onClick={onBackspace}
          disabled={disabled}
          isDarkMode={isDarkMode}
          icon={
            <img
              src={ASSETS.BACKSPACE}
              alt="Backspace"
              className="w-[18px] h-[18px] object-contain"
              style={isDarkMode ? { filter: 'brightness(0) saturate(100%) invert(1)' } : { filter: 'brightness(0)' }}
            />
          }
        />
      </div>
    </div>
  );
};
export default Keypad;
