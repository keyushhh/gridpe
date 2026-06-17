import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useCustomToaster } from '@/contexts/CustomToasterContext';

import { ASSETS } from '@/constants/assets';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import timeIcon from '@/assets/time.svg';
import mapIcon from '@/assets/map.svg';
import cashIcon from '@/assets/cash.svg';
import { PhoneInput } from '@/components/PhoneInput';

const RideAndEarn = () => {
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const { showToaster } = useCustomToaster();

  const [fullName, setFullName] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [cityOpen, setCityOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (phoneDigits.length !== 10) {
      showToaster('Please enter a valid 10-digit phone number', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('rider_interest').insert({
        full_name: fullName.trim(),
        phone: '+91' + phoneDigits,
        city
      });

      if (error) throw error;
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      showToaster('Something went wrong. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div
        className="fixed inset-0 w-full h-full flex flex-col bg-brand-bg-dark safe-top safe-bottom overflow-hidden"
        style={{
          backgroundImage: `url(${ASSETS.SUCCESS_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="flex flex-col items-center px-[35px] safe-top" style={{ paddingTop: '24px' }}>
          <h1 className="text-white text-[22px] font-medium font-satoshi text-center leading-tight">
            You're on the list!
          </h1>

          <div className="mt-[21px] flex items-center justify-center">
            <img loading="lazy" src={ASSETS.CHECK_ICON} alt="Success" style={{ width: '62px', height: '62px' }} />
          </div>

          <p className="mt-[35px] text-white text-[18px] font-bold font-satoshi text-center leading-[140%]">
            We'll reach out when we launch in your city. Welcome to the Grid.Pe family! 🎉
          </p>

          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="mt-[87px] w-[364px] h-[48px] flex items-center justify-center active:scale-95 transition-transform"
            style={{
              backgroundImage: `url(${ASSETS.DARKBG_CTA})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat'
            }}
          >
            <span className="text-white text-[16px] font-medium font-satoshi">
              Back to Home
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-[100dvh] flex flex-col pb-12 ${isDarkMode ? 'bg-brand-bg-dark' : 'bg-white'}`}
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* HEADER */}
      <div className="px-5 pt-12 pb-4">
        <BackButton onClick={() => navigate(-1)} />
      </div>

      {/* HERO SECTION */}
      <div className="px-5 mt-1">
        <h1 className="text-3xl font-bold text-foreground">
          Ride & Earn
        </h1>
        <h1
          className="text-3xl font-bold"
          style={{
            background: 'linear-gradient(90deg, #5260FE, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          with Grid.Pe.
        </h1>

        <div
          className="mt-6 w-full rounded-[16px] p-[14px] flex flex-col"
          style={{ backgroundColor: 'rgba(82, 96, 254, 0.15)' }}
        >
          <div className="flex flex-col gap-[10px]">
            <div className="flex items-center">
              <img loading="lazy" src={timeIcon} alt="Time" className="w-4 h-4 mr-2" />
              <span className="font-satoshi font-normal text-[12px] text-foreground">Flexible hours</span>
            </div>
            <div className="flex items-center">
              <img loading="lazy" src={mapIcon} alt="Map" className="w-4 h-4 mr-2" />
              <span className="font-satoshi font-normal text-[12px] text-foreground">Bangalore (More cities coming soon)</span>
            </div>
            <div className="flex items-center">
              <img loading="lazy" src={cashIcon} alt="Cash" className="w-4 h-4 mr-2" />
              <span className="font-satoshi font-normal text-[12px] text-foreground">Weekly Payouts</span>
            </div>
          </div>
          <p className="mt-[16px] font-satoshi font-normal text-[14px] text-foreground leading-[140%]">
            Join our growing fleet of delivery partners and earn on your own schedule.
          </p>
        </div>
      </div>

      <div className="mt-[25px] px-5">
        <p className="font-satoshi font-medium text-[14px] text-foreground">
          Fill up this small form, and we’ll reach out to you with the next steps!
        </p>
      </div>

      {/* FORM SECTION */}
      <div className="mt-[14px] px-5 flex flex-col gap-[12px]">
        <div className="flex items-center h-[48px] rounded-full transition-all duration-200 bg-brand-bg-light dark:bg-input border border-brand-border-light dark:border-transparent">
          <input
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={60}
            className="flex-1 h-full bg-transparent px-4 text-sm font-normal text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
          />
        </div>

        <PhoneInput
          value={phoneDigits}
          onChange={(val) => setPhoneDigits(val)}
          placeholder="Enter your mobile number"
        />

        <div className="flex items-center h-[48px] rounded-full transition-all duration-200 bg-brand-bg-light dark:bg-input border border-brand-border-light dark:border-transparent opacity-50 pointer-events-none">
          <input
            type="text"
            value="Bangalore"
            disabled
            className="flex-1 h-full bg-transparent px-4 text-sm font-normal text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* CTA SECTION */}
      <div className="mt-[25px] px-5">
        <button
          onClick={handleSubmit}
          disabled={!fullName || phoneDigits.length !== 10 || isSubmitting}
          className={`w-full h-[48px] rounded-full bg-brand-primary text-white text-[16px] font-medium font-satoshi active:scale-95 transition-all ${(!fullName || phoneDigits.length !== 10 || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Submitting...
            </span>
          ) : (
            'Register Interest'
          )}
        </button>

        <div className="mt-[22px] mx-auto max-w-[334px]">
          <p className="text-center font-satoshi font-medium text-[14px] text-muted-foreground leading-[140%]">
            By registering, you agree to be contacted by Grid.Pe when we launch in your city.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RideAndEarn;
