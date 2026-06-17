import React, { useState } from 'react';
import popupBg from '../assets/popup-bg-remove.png';
import { Button } from './ui/button';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface SaveAddressSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (label: string) => void;
  icon?: string;
}

const SaveAddressSheet: React.FC<SaveAddressSheetProps> = ({ isOpen, onClose, onSave, icon }) => {
  const [label, setLabel] = useState('');

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const hasValue = label.length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center pb-[32px] pointer-events-none">
      {/* Backdrop */}
      <div className="fixed inset-0 z-10 bg-black/60 backdrop-blur-md pointer-events-auto" onClick={onClose} />

      {/* Sheet Content */}
      <div
        className="relative z-20 w-[360px] max-w-[90%] flex flex-col items-center pointer-events-auto"
        style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
      >
        <div
          className="relative w-full overflow-hidden rounded-[32px] p-6 text-center border border-white/10"
          style={{
            backgroundImage: `url(${popupBg})`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#000000', // Fallback
          }}
        >
          {/* Header */}
          <div className="text-left mb-6">
            <div className="flex items-center gap-2 mb-1">
              {icon && <img loading="lazy" src={icon} alt="" className="w-5 h-5" />}
              <h2 className="text-[18px] font-bold text-white font-satoshi">Save address as</h2>
            </div>
            <p className="text-[16px] font-medium text-white/80 font-satoshi">
              This is not Home or Work. Name it.
            </p>
          </div>

          {/* Input Field */}
          <div className="relative h-[48px] mb-[22px]">
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className={`w-full h-full bg-brand-card-dark border border-[#313131] rounded-full px-6 text-white text-[14px] outline-none transition-all focus:border-white/40 ${hasValue ? 'pt-0' : ''}`}
            />
            {!hasValue && (
              <div className="absolute inset-0 flex items-center px-6 pointer-events-none">
                <span className="text-white/40 text-[14px]">Save as</span>
                <span className="text-brand-error ml-1">*</span>
              </div>
            )}
          </div>

          {/* Save Button */}
          <Button
            onClick={() => onSave(label)}
            disabled={!hasValue}
            variant="gradient"
            className="w-full rounded-full"
          >
            Save Address
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SaveAddressSheet;
