import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { ChevronLeft, Bike, MapPin, User, Phone, ChevronDown } from 'lucide-react';
import { ASSETS } from '@/constants/assets';
import { ROUTES } from '@/routes';

const RideAndEarn = () => {
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const { showToaster } = useCustomToaster();

  const [fullName, setFullName] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [city, setCity] = useState('');
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
            <img src={ASSETS.CHECK_ICON} alt="Success" style={{ width: '62px', height: '62px' }} />
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
    <div className="min-h-[100dvh] flex flex-col bg-background pb-12">
      {/* HEADER */}
      <div className="px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <ChevronLeft size={24} className="text-foreground" />
        </button>
      </div>

      {/* HERO SECTION */}
      <div className="px-5 mt-2">
        <div 
          className="rounded-2xl p-4 w-fit"
          style={{ background: 'linear-gradient(135deg, #5260FE22, #5260FE44)' }}
        >
          <Bike size={28} color="#5260FE" />
        </div>
        
        <h1 className="mt-4 text-3xl font-bold text-foreground">
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

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Join our growing fleet of delivery partners and earn on your own schedule.
        </p>

        <div className="mt-6 flex gap-3 flex-wrap">
          <div className={`rounded-full px-3 py-1.5 text-xs font-medium ${isDarkMode ? 'bg-white/5 border border-white/10 text-foreground' : 'bg-black/5 border border-black/10 text-foreground'}`}>
            🕕 6AM – 11PM shifts
          </div>
          <div className={`rounded-full px-3 py-1.5 text-xs font-medium ${isDarkMode ? 'bg-white/5 border border-white/10 text-foreground' : 'bg-black/5 border border-black/10 text-foreground'}`}>
            📍 3 cities launching
          </div>
          <div className={`rounded-full px-3 py-1.5 text-xs font-medium ${isDarkMode ? 'bg-white/5 border border-white/10 text-foreground' : 'bg-black/5 border border-black/10 text-foreground'}`}>
            💸 Weekly payouts
          </div>
        </div>
      </div>

      {/* FORM SECTION */}
      <div className="mt-8 px-5 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            FULL NAME
          </label>
            <div className={`rounded-xl border px-4 py-3.5 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/[0.03] border-black/10'}`}>
              <input 
                type="text" 
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={60}
                className="bg-transparent w-full text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              PHONE NUMBER
            </label>
            <div className={`rounded-xl border px-4 py-3.5 flex items-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/[0.03] border-black/10'}`}>
              <span className="text-sm text-foreground mr-2 shrink-0">+91</span>
              <input 
                type="tel" 
                placeholder="XXXXX XXXXX"
                value={phoneDigits}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhoneDigits(digits);
                }}
                maxLength={10}
                className="bg-transparent w-full text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              YOUR CITY
            </label>
            <div className="relative">
              {/* Trigger button */}
              <div
                className={`rounded-xl border px-4 py-3.5 flex items-center justify-between cursor-pointer ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/[0.03] border-black/10'}`}
                onClick={() => setCityOpen(!cityOpen)}
              >
                <span className={`text-sm ${city ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {city || 'Select your city'}
                </span>
                <ChevronDown 
                  size={16} 
                  className="text-muted-foreground transition-transform duration-200"
                  style={{ transform: cityOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </div>
              
              {/* Dropdown options */}
              {cityOpen && (
                <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border overflow-hidden z-50 shadow-xl ${isDarkMode ? 'bg-[#1a1a2e] border-white/10' : 'bg-white border-black/10'}`}>
                  {['Bangalore', 'Guwahati', 'Shillong'].map((c) => (
                    <div
                      key={c}
                      onClick={() => { setCity(c); setCityOpen(false); }}
                      className={`px-4 py-3.5 text-sm cursor-pointer text-foreground border-b last:border-b-0 ${isDarkMode ? 'hover:bg-white/5 border-white/5' : 'hover:bg-black/5 border-black/5'}`}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        <button 
          onClick={handleSubmit}
          disabled={!fullName || !phoneDigits || !city || isSubmitting}
          className={`mt-2 w-full rounded-xl py-4 text-white font-semibold text-sm transition-opacity ${(!fullName || !phoneDigits || !city || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ background: 'linear-gradient(135deg, #5260FE, #7c3aed)' }}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Submitting...
            </span>
          ) : (
            'Register Interest →'
          )}
        </button>

        <p className="mt-4 text-xs text-muted-foreground text-center leading-relaxed">
          By registering, you agree to be contacted by Grid.Pe when we launch in your city.
        </p>
      </div>
    </div>
  );
};

export default RideAndEarn;
