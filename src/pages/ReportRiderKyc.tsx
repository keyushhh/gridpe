import { ASSETS } from '@/constants/assets';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
const ReportRiderKyc = () => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const reasons = [
    'Photo does not match the delivery partner',
    'Wrong name or gender',
    'Fake-looking ID / tampered document',
    'Not the person shown on the app',
    'Other',
  ];
  const isOtherSelected = selectedReason === 'Other';
  const handleSubmit = () => {
    // Validation logic
    if (!selectedReason) return;
    if (isOtherSelected && !comment.trim()) return;
    // Redirect to confirmation on success
    navigate(ROUTES.REPORT_RIDER_CONFIRM);
  };
  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col safe-top overflow-y-auto ${isDarkMode ? 'bg-brand-bg-dark' : 'bg-white'}`}
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Light Mode Yellow Glowing Blob */}
      {!isDarkMode && (
        <div
          className="absolute -top-[150px] left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(50% 50% at 50% 50%, rgba(234, 179, 8, 0.2) 0%, rgba(234, 179, 8, 0) 100%)',
            filter: 'blur(40px)',
            zIndex: 0,
          }}
        />
      )}
      {/* Header */}
      <div
        className="px-5 flex items-center justify-between shrink-0"
        style={{ paddingTop: '24px' }}
      >
        <BackButton onClick={() => navigate(-1)} />
        <h1
          className={`text-[22px] font-medium font-satoshi flex-1 text-center pr-10 ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          Report Rider KYC
        </h1>
      </div>
      <div className="px-5 mt-8 safe-bottom pb-4 space-y-4">
        {/* Pick a Reason Section */}
        <div
          className={`w-full rounded-[12px] border overflow-hidden ${isDarkMode ? 'border-white/10' : 'border-brand-border-light'}`}
          style={{
            backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#FFFFFF',
            backdropFilter: isDarkMode ? 'blur(25px)' : 'none',
          }}
        >
          <div
            className={`px-4 py-3 border-b ${isDarkMode ? 'border-white/5' : 'border-brand-border-light'}`}
          >
            <p
              className={`text-[14px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              Pick a reason*
            </p>
          </div>
          <div className="flex flex-col">
            {reasons.map((reason, index) => (
              <label
                key={reason}
                className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${isDarkMode ? 'active:bg-white/5' : 'active:bg-gray-50'} ${index !== reasons.length - 1 ? `border-b ${isDarkMode ? 'border-white/5' : 'border-brand-border-light'}` : ''}`}
                onClick={() => setSelectedReason(reason)}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedReason === reason ? 'border-brand-primary' : isDarkMode ? 'border-white/30' : 'border-brand-border-light'}`}
                >
                  {selectedReason === reason && (
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
                  )}
                </div>
                <span
                  className={`ml-3 text-[14px] font-normal font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  {reason}
                </span>
              </label>
            ))}
          </div>
        </div>
        {/* Comment Section */}
        <div
          className={`w-full rounded-[12px] border overflow-hidden ${isDarkMode ? 'border-white/10' : 'border-brand-border-light'}`}
          style={{
            backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#FFFFFF',
            backdropFilter: isDarkMode ? 'blur(25px)' : 'none',
          }}
        >
          <div
            className={`px-4 py-3 border-b ${isDarkMode ? 'border-white/5' : 'border-brand-border-light'}`}
          >
            <p
              className={`text-[14px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              Tell us what you noticed {isOtherSelected ? '(Mandatory)*' : '(Optional)'}
            </p>
          </div>
          <div className="p-4">
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="e.g. “Driver’s face didn’t match the photo”, or “Different person showed up.”"
              className={`w-full h-24 bg-transparent text-[14px] font-normal font-satoshi resize-none outline-none ${isDarkMode ? 'text-white placeholder:text-white/30' : 'text-black placeholder:text-brand-text-muted'}`}
            />
          </div>
        </div>
        {/* Attach Proofs Section */}
        <div
          className={`w-full rounded-[12px] border overflow-hidden ${isDarkMode ? 'border-white/10' : 'border-brand-border-light'}`}
          style={{
            backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#FFFFFF',
            backdropFilter: isDarkMode ? 'blur(25px)' : 'none',
          }}
        >
          <button
            onClick={() => setIsAttachmentsOpen(!isAttachmentsOpen)}
            className={`w-full px-4 py-3 flex items-center justify-between ${isDarkMode ? 'border-white/5' : 'border-brand-border-light'}`}
          >
            <p
              className={`text-[14px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              Attach Proofs (Optional)
            </p>
            {isAttachmentsOpen ? (
              <ChevronUp className={`w-5 h-5 ${isDarkMode ? 'text-white/50' : 'text-brand-text-muted'}`} />
            ) : (
              <ChevronDown
                className={`w-5 h-5 ${isDarkMode ? 'text-white/50' : 'text-brand-text-muted'}`}
              />
            )}
          </button>
          {isAttachmentsOpen && (
            <div
              className={`px-4 pb-6 flex flex-col items-center justify-center border-t pt-4 animate-in fade-in slide-in-from-top-2 ${isDarkMode ? 'border-white/5' : 'border-brand-border-light'}`}
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${isDarkMode ? 'bg-white/5' : 'bg-brand-bg-light'}`}
              >
                <ImageIcon className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-gray-600'}`} />
              </div>
              <p
                className={`text-[12px] font-normal font-satoshi text-center ${isDarkMode ? 'text-white/40' : 'text-brand-text-muted'}`}
              >
                Upload a photo or video that shows the issue
              </p>
            </div>
          )}
        </div>
        {/* Action Buttons */}
        <div className="pt-4 space-y-3">
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || (isOtherSelected && !comment.trim())}
            className={`w-full h-12 rounded-full flex items-center justify-center text-white text-[16px] font-medium font-satoshi transition-all active:scale-95 ${!selectedReason || (isOtherSelected && !comment.trim()) ? 'bg-brand-primary/50 opacity-50' : 'bg-brand-primary'}`}
          >
            Submit
          </button>
          <button
            onClick={() => navigate(-1)}
            className={`w-full h-12 rounded-full flex items-center justify-center text-[16px] font-medium font-satoshi active:scale-95 transition-all ${isDarkMode ? 'text-white bg-white/5 border border-white/10' : 'text-black bg-white border border-brand-border-light'}`}
          >
            Cancel
          </button>
        </div>
        <p
          className={`text-[12px] font-normal text-left pt-2 leading-tight ${isDarkMode ? 'text-white/50' : 'text-brand-text-muted'}`}
        >
          <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
            *All reports are confidential
          </span>{' '}
          and helps us keep Grid.Pe secure for everyone.
        </p>
      </div>
    </div>
  );
};
export default ReportRiderKyc;
