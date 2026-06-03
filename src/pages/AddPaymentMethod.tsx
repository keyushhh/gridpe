import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { fetchBankAccounts, BankAccount } from '@/lib/banking';
import { getBankLogo } from '@/utils/bankUtils';
import { useUser } from '@/contexts/UserContext';
interface UpiMethod {
  id: string;
  name: string;
  icon: string;
  type: 'upi';
  linked: boolean;
  hasInput?: boolean;
  inputPlaceholder?: string;
  subtitle?: string;
}
interface StaticMethod {
  id: string;
  name: string;
  icon: string;
  type: 'wallet' | 'netbanking';
  linked: boolean;
  subtitle?: string;
  hasInput?: boolean;
  inputPlaceholder?: string;
}
type PaymentMethod =
  | UpiMethod
  | StaticMethod
  | (BankAccount & {
      type: 'card';
      linked: boolean;
      icon: string;
      name: string;
      subtitle?: string;
      hasInput?: boolean;
      inputPlaceholder?: string;
    });
const upiAppMethods: UpiMethod[] = [
  { id: 'cred', name: 'CRED UPI', icon: ASSETS.CRED, type: 'upi', linked: true },
  { id: 'gpay', name: 'Google Pay UPI', icon: ASSETS.GPAY, type: 'upi', linked: true },
  { id: 'phonepe', name: 'PhonePe UPI', icon: ASSETS.PHONEPE, type: 'upi', linked: true },
  {
    id: 'upi-id',
    name: 'UPI ID',
    icon: '',
    type: 'upi',
    linked: false,
    hasInput: true,
    inputPlaceholder: 'Required',
  },
];
const staticMoreMethods: StaticMethod[] = [
  { id: 'amazon', name: 'Amazon Pay Wallet', icon: ASSETS.AMAZON, type: 'wallet', linked: true },
  {
    id: 'netbanking',
    name: 'HDFC Netbanking',
    icon: ASSETS.HDFC_BANK_LOGO,
    type: 'netbanking',
    linked: true,
    subtitle: 'Savings account | 5233',
  },
];
const AddPaymentMethod = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkMode = useIsDarkMode();
  const { profile } = useUser();
  const userId = profile?.id;
  const { amount, flow, tier } = location.state || { amount: '0.00', flow: 'add-money', tier: '' };
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [upiId, setUpiId] = useState<string>('');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadBanks = async () => {
      if (!userId) return;
      try {
        const accounts = await fetchBankAccounts(userId);
        setBankAccounts(accounts);
      } catch (error) {
        console.error('Error loading bank accounts:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    };
    loadBanks();
  }, [userId]);
  const cardMethods = bankAccounts.map(acc => ({
    ...acc,
    id: acc.id,
    name: acc.account_number.replace(/\d(?=\d{4})/g, '*'),
    icon: getBankLogo(acc.bank_name),
    type: 'card' as const,
    linked: true,
    subtitle: `${acc.bank_name} | ${acc.account_type}`,
  }));
  const hasLinkedMethods = bankAccounts.length > 0 || upiAppMethods.some(m => m.linked);
  const title =
    flow === 'withdrawal'
      ? 'Add Payment Method'
      : hasLinkedMethods
        ? 'Select Payment'
        : 'Add Payment';
  const upiMethods = upiAppMethods;
  const moreMethods = staticMoreMethods;
  const glassContainerStyle: React.CSSProperties = {
    backgroundColor: 'rgba(25, 25, 25, 0.31)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    position: 'relative',
    borderRadius: '22px',
  };
  const StrokeOverlay = () => (
    <div
      className="absolute inset-0 pointer-events-none rounded-[22px]"
      style={{
        padding: '0.63px',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.20))',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
      }}
    />
  );
  const Divider = () => <div className="w-[338px] h-[1px] bg-brand-border-dark mx-auto" />;
  const RadioButton = ({ selected }: { selected: boolean }) => (
    <div
      className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
        selected ? 'border-brand-primary-light' : 'border-brand-primary-light/50'
      }`}
    >
      {selected && <div className="w-[12px] h-[12px] rounded-full bg-brand-primary-light" />}
    </div>
  );
  const handleProceed = () => {
    if (!selectedMethod) return;
    const method = [...upiAppMethods, ...cardMethods, ...staticMoreMethods].find(
      m => m.id === selectedMethod
    );
    const navState = {
      ...location.state,
      amount,
      paymentMethod: method,
      upiId: selectedMethod === 'upi-id' ? upiId : undefined,
    };
    if (location.state?.flow === 'withdrawal') {
      navigate(ROUTES.SELECT_PAYMENT_METHOD, { state: navState });
    } else if (location.state?.flow === 'upgrade') {
      navigate(ROUTES.SUBSCRIPTION_DETAILS, { state: navState });
    } else {
      navigate(ROUTES.ORDER_SUMMARY, { state: navState });
    }
  };
  const renderPaymentRow = (method: PaymentMethod, isLast: boolean) => (
    <React.Fragment key={method.id}>
      <div
        className={`flex items-center h-[32px] cursor-pointer ${!isLast ? 'mb-[9px]' : ''}`}
        onClick={() => method.linked && setSelectedMethod(method.id)}
      >
        {method.icon && (
          <img loading="eager" decoding="async"             src={method.id === 'cred' && !isDarkMode ? ASSETS.CRED_LIGHT : method.icon}
            alt={method.name}
            className="w-[32px] h-[32px] object-contain"
          />
        )}
        <div
          className={`flex flex-row items-center flex-1 ${method.icon ? 'ml-[8px]' : ''} min-w-0`}
        >
          <span
            className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans leading-none shrink-0`}
          >
            {method.name}
          </span>
          {method.hasInput ? (
            <input
              type="text"
              value={upiId}
              onChange={e => setUpiId(e.target.value)}
              placeholder={method.inputPlaceholder}
              className={`ml-[36px] bg-transparent border-none outline-none text-[14px] font-medium font-sans flex-1 ${isDarkMode ? 'text-white placeholder:text-[#FAFAFA]/30' : 'text-black placeholder:text-black/30'}`}
              onClick={e => {
                e.stopPropagation();
                setSelectedMethod(method.id);
              }}
            />
          ) : (
            method.subtitle && (
              <span
                className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[12px] font-medium font-sans leading-none ml-[8px]`}
              >
                {method.subtitle}
              </span>
            )
          )}
        </div>
        <div className="ml-auto pl-2">
          <RadioButton selected={selectedMethod === method.id} />
        </div>
      </div>
      {!isLast && (
        <div
          className={`w-[338px] h-[1px] mx-auto ${isDarkMode ? 'bg-brand-border-dark' : 'bg-brand-border-light'}`}
        />
      )}
      {!isLast && <div className="h-[10px]" />}
    </React.Fragment>
  );
  return (
    <div
      className="h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-top safe-bottom pb-8"
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Light Mode Purple Glow (Top Center) */}
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-brand-primary rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
      )}
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between relative z-10 shrink-0">
        <BackButton onClick={() => navigate(-1)} />
        <h1
          className={`text-[19px] font-medium leading-[120%] font-sans absolute left-1/2 -translate-x-1/2 ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          {title}
        </h1>
        <div className="w-10" />
      </div>
      <div className="flex-1 flex flex-col items-center pt-[34px] px-5">
        {/* UPI Header */}
        <div className="w-full flex items-center mb-[12px] z-10">
          <img loading="lazy" decoding="async" src={ASSETS.UPI} alt="UPI" className="w-[32px] h-[32px] object-contain" />
          <span
            className={`ml-[14px] text-[16px] font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            Pay using any UPI App
          </span>
        </div>
        {/* UPI Container */}
        <div
          className="w-full rounded-[22px] flex flex-col px-[10px] overflow-hidden z-10"
          style={{
            backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#FFFFFF',
            backdropFilter: isDarkMode ? 'blur(20px)' : 'none',
            WebkitBackdropFilter: isDarkMode ? 'blur(20px)' : 'none',
            border: isDarkMode ? 'none' : '1px solid #E9EAEB',
            boxShadow: isDarkMode ? 'none' : '0px 4px 12px rgba(0,0,0,0.02)',
            position: 'relative',
            paddingTop: '12px',
            paddingBottom: '12px',
          }}
        >
          {isDarkMode && <StrokeOverlay />}
          {upiMethods.map((method, i) => renderPaymentRow(method, i === upiMethods.length - 1))}
        </div>
        {/* Cards Section */}
        <div className="w-full mt-[36px] flex flex-col z-10">
          <span
            className={`text-[16px] font-bold font-sans mb-[12px] ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            Cards
          </span>
          {cardMethods.length > 0 ? (
            <div
              className="w-full rounded-[22px] flex flex-col px-[10px] overflow-hidden"
              style={{
                backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#FFFFFF',
                backdropFilter: isDarkMode ? 'blur(20px)' : 'none',
                WebkitBackdropFilter: isDarkMode ? 'blur(20px)' : 'none',
                border: isDarkMode ? 'none' : '1px solid #E9EAEB',
                boxShadow: isDarkMode ? 'none' : '0px 4px 12px rgba(0,0,0,0.02)',
                position: 'relative',
                paddingTop: '12px',
                paddingBottom: '12px',
              }}
            >
              {isDarkMode && <StrokeOverlay />}
              {cardMethods.map((method, i) =>
                renderPaymentRow(method, i === cardMethods.length - 1)
              )}
            </div>
          ) : (
            <div
              className="w-full h-[66px] rounded-[22px] relative flex flex-col justify-center pl-[20px] pr-[13px] overflow-hidden"
              style={{
                backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#FFFFFF',
                backdropFilter: isDarkMode ? 'blur(20px)' : 'none',
                WebkitBackdropFilter: isDarkMode ? 'blur(20px)' : 'none',
                border: isDarkMode ? 'none' : '1px solid #E9EAEB',
              }}
            >
              {isDarkMode && <StrokeOverlay />}
              <div className="absolute right-[20px] top-1/2 -translate-y-1/2">
                <img loading="lazy" decoding="async"                   src={ASSETS.ADD}
                  alt="Add"
                  className={`w-[20px] h-[20px] ${isDarkMode ? '' : 'invert'}`}
                />
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-[16px] font-bold font-sans leading-none mb-[6px] ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  Add a credit or debit card
                </span>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-[12px] font-light font-sans leading-none ${isDarkMode ? 'text-white' : 'text-black/60'}`}
                  >
                    Incl.
                  </span>
                  <span
                    className={`text-[12px] font-bold font-sans leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}
                  >
                    ₹9 Processing Fee
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* More Payment Options */}
        <div className="w-full mt-[24px] flex flex-col z-10">
          <span
            className={`text-[16px] font-bold font-sans mb-[12px] ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            More Payment Options
          </span>
          <div
            className="w-full rounded-[22px] flex flex-col px-[10px] overflow-hidden"
            style={{
              backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#FFFFFF',
              backdropFilter: isDarkMode ? 'blur(20px)' : 'none',
              WebkitBackdropFilter: isDarkMode ? 'blur(20px)' : 'none',
              border: isDarkMode ? 'none' : '1px solid #E9EAEB',
              boxShadow: isDarkMode ? 'none' : '0px 4px 12px rgba(0,0,0,0.02)',
              position: 'relative',
              paddingTop: '12px',
              paddingBottom: '12px',
            }}
          >
            {isDarkMode && <StrokeOverlay />}
            {moreMethods.map((method, i) => renderPaymentRow(method, i === moreMethods.length - 1))}
          </div>
        </div>
      </div>
      {/* Bottom CTAs */}
      <div className="px-5 mt-[32px] mb-[42px] flex flex-col gap-[12px] z-10">
        <button
          onClick={handleProceed}
          disabled={!selectedMethod}
          className={`w-full h-[48px] rounded-full text-white text-[16px] font-bold transition-all flex items-center justify-center ${
            selectedMethod
              ? 'bg-brand-primary-light active:scale-95 shadow-lg shadow-brand-primary-light/20'
              : 'bg-brand-primary-light/40 cursor-not-allowed'
          }`}
        >
          Proceed
        </button>
        <button
          onClick={() => navigate(-1)}
          className={`w-full h-[48px] rounded-full text-[16px] font-bold active:scale-95 transition-transform flex items-center justify-center ${isDarkMode ? 'bg-transparent border border-[#2C2C2C] text-white' : 'bg-[#F2F2F2] text-black'}`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
export default AddPaymentMethod;
