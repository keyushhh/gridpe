import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import BackButton from '@/components/ui/BackButton';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { fetchBankAccounts, BankAccount } from '@/lib/banking';
import { getBankLogo } from '@/utils/bankUtils';
import { useWebScroll } from '@/hooks/useWebScroll';
import { useUser } from '@/contexts/UserContext';
interface PaymentMethod {
  id: string;
  name: string;
  icon?: string;
  subtitle?: string;
  hasInput?: boolean;
  inputPlaceholder?: string;
}
const SelectPaymentMethod = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useUser();
  const isDarkMode = useIsDarkMode();
  const { showToaster } = useCustomToaster();
  const { amount, forceManual } = location.state || {};
  const [selectedMethod, setSelectedMethod] = useState<string>(forceManual ? 'upi-id' : '');
  const [upiId, setUpiId] = useState<string>('');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadBanks = async () => {
      try {
        if (!profile?.id) {
          setBankAccounts([]);
          setLoading(false);
          return;
        }
        const accounts = await fetchBankAccounts(profile.id);
        setBankAccounts(accounts);
        if (accounts.length > 0) {
          const defaultAcc = accounts.find(a => a.is_default) || accounts[0];
          setSelectedMethod(defaultAcc.id);
        }
      } catch (error) {
        console.error('Error loading bank accounts:', error);
      } finally {
        setLoading(false);
      }
    };
    loadBanks();
  }, [profile?.id]);
  const RadioButton = ({ selected }: { selected: boolean }) => (
    <div
      className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
        selected ? 'border-brand-primary-light' : 'border-brand-primary-light/50'
      }`}
    >
      {selected && <div className="w-[12px] h-[12px] rounded-full bg-brand-primary-light" />}
    </div>
  );
  const upiMethods: PaymentMethod[] = [
    { id: 'cred', name: 'CRED UPI', icon: ASSETS.CRED },
    { id: 'gpay', name: 'Google Pay UPI', icon: ASSETS.GPAY },
    { id: 'phonepe', name: 'PhonePe UPI', icon: ASSETS.PHONEPE },
    { id: 'upi-id', name: 'UPI ID', hasInput: true, inputPlaceholder: 'Required' },
  ];
  const cardMethods: PaymentMethod[] = bankAccounts.map(acc => ({
    id: acc.id,
    name: acc.account_number.replace(/\d(?=\d{4})/g, '*'), // Mask all but last 4
    icon: getBankLogo(acc.bank_name),
    subtitle: `${acc.bank_name} | ${acc.account_type}`,
  }));
  const moreMethods: PaymentMethod[] = [
        {
      id: 'netbanking',
      name: 'HDFC Netbanking',
      icon: ASSETS.HDFC_BANK_LOGO,
      subtitle: 'Savings account | 5233',
    },
  ];
  return (
    <div
      className={`h-full w-full ${containerOverflow} flex flex-col safe-top ${isDarkMode ? '' : 'bg-white'}`}
      style={
        isDarkMode
          ? {
              backgroundColor: '#0a0a12',
              backgroundImage: `url(${ASSETS.BG_DARK_MODE})`,
              backgroundSize: 'cover',
              backgroundPosition: 'top center',
              backgroundRepeat: 'no-repeat',
            }
          : {}
      }
    >
      {/* Light Mode Purple Glow (Top Center) */}
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-brand-primary rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
      )}
      {/* Header */}
      <div className="px-5 pt-4 flex items-center justify-between relative z-10 shrink-0">
        <BackButton onClick={() => navigate(-1)} />
        <h1
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium leading-[120%] font-satoshi absolute left-1/2 -translate-x-1/2`}
        >
          Select Payment
        </h1>
      </div>
      <div className="flex-1 flex flex-col px-5 pt-[34px] overflow-y-auto overscroll-y-contain pb-32 z-10 min-h-0">
        {/* Sub-text - 34px below header */}
        <p
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-satoshi leading-tight mb-[22px]`}
        >
          Select a payment method where you want the amount to be refunded.
        </p>
        {/* UPI Section */}
        <div className="w-full flex flex-col mb-[36px] items-center">
          <div className="w-[362px] mb-[12px] flex justify-start">
            <img loading="eager" decoding="async" src={ASSETS.UPI} alt="UPI" className="w-[32px] h-[32px] object-contain" />
          </div>
          <div
            className="rounded-[12px] flex flex-col px-[10px] overflow-hidden"
            style={{
              width: '362px',
              height: '202px',
              backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#FFFFFF',
              backdropFilter: isDarkMode ? 'blur(20px)' : 'none',
              WebkitBackdropFilter: isDarkMode ? 'blur(20px)' : 'none',
              border: isDarkMode ? 'none' : '1px solid #E9EAEB',
              boxShadow: isDarkMode ? 'none' : '0px 4px 12px rgba(0,0,0,0.02)',
              position: 'relative',
              justifyContent: 'space-around',
            }}
          >
            {isDarkMode && (
              <div
                className="absolute inset-0 pointer-events-none rounded-[12px]"
                style={{
                  padding: '0.63px',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.20))',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
              />
            )}
            {upiMethods.map((method, i) => (
              <React.Fragment key={method.id}>
                <div
                  className="flex items-center h-[45px] cursor-pointer"
                  onClick={() => setSelectedMethod(method.id)}
                >
                  {method.icon && (
                    <img loading="lazy" decoding="async"                       src={method.id === 'cred' && !isDarkMode ? ASSETS.CRED_LIGHT : method.icon}
                      alt={method.name}
                      className="w-[28px] h-[28px] object-contain"
                    />
                  )}
                  <div
                    className={`flex flex-row items-center flex-1 ${method.icon ? 'ml-[12px]' : ''}`}
                  >
                    <span
                      className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-bold font-sans shrink-0`}
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
                          className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[10px] font-medium font-sans ml-[12px]`}
                        >
                          {method.subtitle}
                        </span>
                      )
                    )}
                  </div>
                  <RadioButton selected={selectedMethod === method.id} />
                </div>
                {i < upiMethods.length - 1 && (
                  <div
                    className={`w-full h-[1px] ${isDarkMode ? 'bg-brand-border-dark' : 'bg-brand-border-light'}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="w-full mb-[36px] flex flex-col items-center">
          <div className="w-[364px] mb-[12px]">
            <h2
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans`}
            >
              {bankAccounts.length > 0 ? 'Linked Bank Accounts' : 'Cards'}
            </h2>
          </div>
          {loading ? (
            <div className="flex flex-col gap-2 mt-2 w-[364px]">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-[12px] animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <div className="w-5 h-5 rounded-full bg-white/10 shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-3.5 w-36 rounded-full bg-white/10" />
                    <div className="h-3 w-24 rounded-full bg-white/10" />
                  </div>
                  <div className="w-4 h-4 rounded-full bg-white/10 shrink-0" />
                </div>
              ))}
            </div>
          ) : bankAccounts.length === 0 ? (
            <div className="w-[364px] p-4 rounded-[22px] border border-brand-border-light text-center">
              <p className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[14px]`}>
                No bank accounts linked.
              </p>
            </div>
          ) : (
            <div
              className="rounded-[22px] flex flex-col px-[10px] overflow-hidden"
              style={{
                width: '364px',
                minHeight: '66px',
                backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#FFFFFF',
                backdropFilter: isDarkMode ? 'blur(20px)' : 'none',
                WebkitBackdropFilter: isDarkMode ? 'blur(20px)' : 'none',
                border: isDarkMode ? 'none' : '1px solid #E9EAEB',
                boxShadow: isDarkMode ? 'none' : '0px 4px 12px rgba(0,0,0,0.02)',
                position: 'relative',
                justifyContent: 'center',
              }}
            >
              {isDarkMode && (
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
              )}
              {cardMethods.map((method, i) => (
                <React.Fragment key={method.id}>
                  <div
                    className={`flex items-center ${cardMethods.length === 1 ? 'h-[66px]' : 'h-[55px]'} cursor-pointer`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <img loading="lazy" decoding="async"                       src={method.icon}
                      alt={method.name}
                      className="w-[32px] h-[32px] object-contain"
                    />
                    <div className="flex flex-col flex-1 ml-[12px]">
                      <span
                        className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans`}
                      >
                        {method.name}
                      </span>
                      {method.subtitle && (
                        <span
                          className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[11px] font-medium font-sans`}
                        >
                          {method.subtitle}
                        </span>
                      )}
                    </div>
                    <RadioButton selected={selectedMethod === method.id} />
                  </div>
                  {i < cardMethods.length - 1 && (
                    <div
                      className={`w-full h-[1px] ${isDarkMode ? 'bg-brand-border-dark' : 'bg-brand-border-light'}`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
        {/* More Payment Options */}
        <div className="w-full mb-8 flex flex-col items-center">
          <div className="w-[364px] mb-[12px]">
            <h2
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans`}
            >
              More Payment Options
            </h2>
          </div>
          <div
            className="rounded-[16px] flex flex-col px-[10px] overflow-hidden"
            style={{
              width: '364px',
              height: '117px',
              backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#FFFFFF',
              backdropFilter: isDarkMode ? 'blur(20px)' : 'none',
              WebkitBackdropFilter: isDarkMode ? 'blur(20px)' : 'none',
              border: isDarkMode ? 'none' : '1px solid #E9EAEB',
              boxShadow: isDarkMode ? 'none' : '0px 4px 12px rgba(0,0,0,0.02)',
              position: 'relative',
              justifyContent: 'space-around',
            }}
          >
            {isDarkMode && (
              <div
                className="absolute inset-0 pointer-events-none rounded-[16px]"
                style={{
                  padding: '0.63px',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.20))',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
              />
            )}
            {moreMethods.map((method, i) => (
              <React.Fragment key={method.id}>
                <div
                  className="flex items-center h-[50px] cursor-pointer"
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <img loading="lazy" decoding="async"                     src={method.icon}
                    alt={method.name}
                    className="w-[32px] h-[32px] object-contain"
                  />
                  <div className="flex flex-col flex-1 ml-[12px]">
                    <span
                      className={`${isDarkMode ? 'text-white' : 'text-black'} text-[15px] font-bold font-sans`}
                    >
                      {method.name}
                    </span>
                    {method.subtitle && (
                      <span
                        className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[11px] font-medium font-sans`}
                      >
                        {method.subtitle}
                      </span>
                    )}
                  </div>
                  <RadioButton selected={selectedMethod === method.id} />
                </div>
                {i < moreMethods.length - 1 && (
                  <div
                    className={`w-full h-[1px] ${isDarkMode ? 'bg-brand-border-dark' : 'bg-brand-border-light'}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      {/* Footer CTAs - Absolute with blur */}
      <div
        className="absolute bottom-0 left-0 right-0 px-5 safe-bottom pb-4 pt-5 flex flex-col gap-3 z-30"
        style={{
          backgroundColor: isDarkMode ? 'rgba(10, 10, 18, 0.4)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <button
          onClick={() => {
            const methodObj =
              upiMethods.find(m => m.id === selectedMethod) ||
              cardMethods.find(m => m.id === selectedMethod) ||
              moreMethods.find(m => m.id === selectedMethod);
            showToaster('This feature is currently unavailable', 'error');
          }}
          disabled={selectedMethod === 'upi-id' && !upiId}
          className={`w-full h-[48px] rounded-full text-white text-[16px] font-bold active:scale-95 transition-transform flex items-center justify-center bg-brand-primary-light ${selectedMethod === 'upi-id' && !upiId ? 'opacity-50 pointer-events-none' : ''}`}
        >
          Proceed
        </button>
        <button
          onClick={() => navigate(-1)}
          className={`w-full h-[48px] rounded-full text-[16px] font-bold active:scale-95 transition-transform flex items-center justify-center ${isDarkMode ? 'bg-transparent border border-white/10 text-white' : 'bg-[#F2F2F2] text-black border border-brand-border-light'}`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
export default SelectPaymentMethod;
