import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Pause, 
  Play, 
  RotateCcw, 
  Sparkles, 
  Sliders,
  PhoneOff,
  ArrowRight,
  Settings,
  Square,
  Check,
  MapPin,
  Plus
} from 'lucide-react';
import { ThinkingOrb } from 'thinking-orbs';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { fetchAddresses, isAddressComplete } from '@/lib/addresses';
import { useLocationStore } from '@/store/useLocationStore';
import { Address } from '@/types';

export type VoiceConversationState = 'listening' | 'thinking' | 'speaking' | 'idle';

export interface SlotState {
  amount: number | null;
  addressLabel: string | null;
  addressId?: string | null;
  selectedAddress?: Address | null;
  confirmed: boolean;
  orderId?: string | null;
}

export interface VoiceConversationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (slots: SlotState) => void;
}

interface ScriptStep {
  stepIndex: number;
  assistantPrompt: string | ((slots: SlotState) => string);
  userReply: string;
  updatedSlots: Partial<SlotState> | ((slots: SlotState) => Partial<SlotState>);
  isFinal?: boolean;
}

/**
 * Normalizes an address object or raw label to a user-friendly conversational name.
 * - If address.label is "Current Location" (or null/empty), falls back to address.area (e.g. "HRBR Layout").
 * - If area is also empty/null, falls back to "your saved address" (never hardcodes "Home").
 * - Otherwise returns the custom address label (e.g. "Home", "Work", "Office").
 */
export function getNormalizedAddressLabel(address?: Partial<Address> | null, rawLabel?: string | null): string {
  const label = (rawLabel ?? address?.label ?? '').trim();
  const isCurrentLocationOrEmpty = !label || label.toLowerCase() === 'current location';

  if (!isCurrentLocationOrEmpty) {
    return label;
  }

  const area = (address?.area || '').trim();
  if (area && area.toLowerCase() !== 'current location') {
    return area;
  }

  return 'your saved address';
}

/**
 * Multilingual Conversational Voice Prompt Generators
 */
export function getAmountPrompt(lang?: string | null): string {
  const code = (lang || 'en').split('-')[0].toLowerCase();
  switch (code) {
    case 'hi': return 'आपको कितने रुपये चाहिए?';
    case 'bn': return 'আপনার কত টাকা লাগবে?';
    case 'kn': return 'ನಿಮಗೆ ಎಷ್ಟು ನಗದು ಬೇಕು?';
    case 'ta': return 'உங்களுக்கு எவ்வளவு பணம் தேவை?';
    case 'te': return 'మీకు ఎంత నగదు కావాలి?';
    case 'mr': return 'तुम्हाला किती रोख रक्कम हवी आहे?';
    case 'gu': return 'તમારે કેટલા રોકડા જોઈએ છે?';
    case 'pa': return 'ਤੁਹਾਨੂੰ ਕਿੰਨੀ ਨਕਦੀ ਚਾਹੀਦੀ ਹੈ?';
    case 'ml': return 'നിങ്ങൾക്ക് എത്ര പണം വേണം?';
    case 'od': return 'ଆପଣଙ୍କୁ କେତେ ଟଙ୍କା ଦରକାର?';
    default: return 'How much cash do you need?';
  }
}

export function getAmountMinHintPrompt(lang?: string | null): string {
  const code = (lang || 'en').split('-')[0].toLowerCase();
  switch (code) {
    case 'hi': return 'कम से कम 500 रुपये का ऑर्डर होता है। आपको कितने रुपये चाहिए?';
    case 'bn': return 'কমপক্ষে ৫০০ টাকার অর্ডার করতে হবে। আপনার কত টাকা লাগবে?';
    case 'kn': return 'ಕನಿಷ್ಠ ಮೊತ್ತ ₹500. ನಿಮಗೆ ಎಷ್ಟು ನಗದು ಬೇಕು?';
    case 'ta': return 'குறைந்தபட்ச தொகை ₹500. உங்களுக்கு எவ்வளவு பணம் தேவை?';
    case 'te': return 'కనీస మొత్తం ₹500. మీకు ఎంత నగదు కావాలి?';
    case 'mr': return 'किमान रक्कम ₹500 आहे. तुम्हाला किती रोख रक्कम हवी आहे?';
    case 'gu': return 'ઓછામાં ઓછી રકમ ₹500 છે. તમારે કેટલા રોકડા જોઈએ છે?';
    case 'pa': return 'ਘੱਟੋ-ਘੱਟ ਰਕਮ ₹500 ਹੈ। ਤੁਹਾਨੂੰ ਕਿੰਨੀ ਨਕਦੀ ਚਾਹੀਦੀ ਹੈ?';
    case 'ml': return 'കുറഞ്ഞ തുക ₹500 ആണ്. നിങ്ങൾക്ക് എത്ര പണം വേണം?';
    case 'od': return 'ସର୍ବନିମ୍ନ ରାଶି ₹୫୦୦। ଆପଣଙ୍କୁ କେତେ ଟଙ୍କା ଦରକାର?';
    default: return 'Minimum order is ₹500. How much cash do you need?';
  }
}

export function getAmountReaskPrompt(lang?: string | null): string {
  const code = (lang || 'en').split('-')[0].toLowerCase();
  switch (code) {
    case 'hi': return 'माफ़ कीजिए, समझ नहीं आया। आपको कितने रुपये चाहिए?';
    case 'bn': return 'দুঃখিত, বুঝতে পারিনি। আপনার কত টাকা লাগবে?';
    case 'kn': return 'ಕ್ಷಮಿಸಿ, ಅರ್ಥವಾಗಲಿಲ್ಲ. ನಿಮಗೆ ಎಷ್ಟು ನಗದು ಬೇಕು?';
    case 'ta': return 'மன்னிக்கவும், புரியவில்லை. உங்களுக்கு எவ்வளவு பணம் தேவை?';
    case 'te': return 'క్షమించండి, అర్థం కాలేదు. మీకు ఎంత నగదు కావాలి?';
    case 'mr': return 'क्षमस्व, समजले नाही. तुम्हाला किती रोख रक्कम हवी आहे?';
    case 'gu': return 'માફ કરશો, સમજાયું નહીં. તમારે કેટલા રોકડા જોઈએ છે?';
    case 'pa': return 'ਮਾਫ਼ ਕਰਨਾ, ਸਮਝ ਨਹੀਂ ਆਇਆ। ਤੁਹਾਨੂੰ ਕਿੰਨੀ ਨਕਦੀ ਚਾਹੀਦੀ ਹੈ?';
    case 'ml': return 'ക്ഷമിക്കണം, മനസ്സിലായില്ല. നിങ്ങൾക്ക് എത്ര പണം വേണം?';
    case 'od': return 'କ୍ଷମା କରିବେ, ବୁଝିପାରିଲି ନାହିଁ। ଆପଣଙ୍କୁ କେତେ ଟଙ୍କା ଦରକାର?';
    default: return "Sorry, I didn't catch that. How much cash do you need?";
  }
}

export function getAddressPrompt(amount: number, label: string, isMultiple: boolean, lang?: string | null): string {
  const code = (lang || 'en').split('-')[0].toLowerCase();
  switch (code) {
    case 'hi':
      return isMultiple
        ? `${label} पर ₹${amount} डिलीवर करें, सही है या कोई और पता?`
        : `${label} पर ₹${amount} डिलीवर करें, सही है?`;
    case 'bn':
      return isMultiple
        ? `${label}-এ ₹${amount} ডেলিভারি করব, ঠিক আছে নাকি অন্য কোনো ঠিকানা?`
        : `${label}-এ ₹${amount} ডেলিভারি করব, ঠিক আছে?`;
    case 'kn':
      return isMultiple
        ? `₹${amount} ಅನ್ನು ${label} ಗೆ ತಲುಪಿಸಬೇಕೇ, ಅಥವಾ ಬೇರೆ ವಿಳಾಸವೇ?`
        : `₹${amount} ಅನ್ನು ${label} ಗೆ ತಲುಪಿಸಬೇಕೇ?`;
    case 'ta':
      return isMultiple
        ? `₹${amount} ஐ ${label} க்கு டெலிவரி செய்யலாமா, அல்லது வேறு முகவரியா?`
        : `₹${amount} ஐ ${label} க்கு டெலிவரி செய்யலாமா?`;
    case 'te':
      return isMultiple
        ? `₹${amount} ను ${label} కి డెలివరీ చేయాలా, లేదా వేరే చిరునామానా?`
        : `₹${amount} ను ${label} కి డెలివరీ చేయాలా?`;
    case 'mr':
      return isMultiple
        ? `${label} वर ₹${amount} डिलिव्हर करायचे का, की दुसरा पत्ता?`
        : `${label} वर ₹${amount} डिलिव्हर करायचे का?`;
    case 'gu':
      return isMultiple
        ? `${label} પર ₹${amount} પહોંચાડવું છે, બરાબર છે કે બીજું કોઈ સરનામું?`
        : `${label} પર ₹${amount} પહોંચાડવું છે, બરાબર છે?`;
    case 'pa':
      return isMultiple
        ? `${label} 'ਤੇ ₹${amount} ਡਿਲੀਵਰ ਕਰਨਾ ਹੈ, ਠੀਕ ਹੈ ਜਾਂ ਕੋਈ ਹੋਰ ਪਤਾ?`
        : `${label} 'ਤੇ ₹${amount} ਡਿਲੀਵਰ ਕਰਨਾ ਹੈ, ਠੀਕ ਹੈ?`;
    case 'ml':
      return isMultiple
        ? `₹${amount} ${label}-ലേക്ക് എത്തിക്കണോ, അതോ മറ്റൊരു വിലാസത്തിലേക്കോ?`
        : `₹${amount} ${label}-ലേക്ക് എത്തിക്കണോ?`;
    case 'od':
      return isMultiple
        ? `${label} ରେ ₹${amount} ଡେଲିଭର କରିବା, ଠିକ ଅଛି କି ଅନ୍ୟ କୌଣସି ଠିକଣା?`
        : `${label} ରେ ₹${amount} ଡେଲିଭର କରିବା, ଠିକ ଅଛି?`;
    default:
      return isMultiple
        ? `Delivering ₹${amount} to ${label}, is that right, or a different address?`
        : `Delivering ₹${amount} to ${label}, is that right?`;
  }
}

export function getConfirmationPrompt(amount: number, label: string, lang?: string | null): string {
  const code = (lang || 'en').split('-')[0].toLowerCase();
  switch (code) {
    case 'hi': return `${label} पर ₹${amount} का ऑर्डर कन्फर्म करें?`;
    case 'bn': return `${label}-এ ₹${amount}-এর অর্ডার কনফার্ম করবেন?`;
    case 'kn': return `${label} ಗೆ ₹${amount} ಆರ್ಡರ್ ದೃಢೀಕರಿಸಬೇಕೇ?`;
    case 'ta': return `${label} க்கு ₹${amount} ஆர்டரை உறுதிப்படுத்தவா?`;
    case 'te': return `${label} కి ₹${amount} ఆర్డర్‌ను ఖరారు చేయాలా?`;
    case 'mr': return `${label} वर ₹${amount} ची ऑर्डर कन्फर्म करायची का?`;
    case 'gu': return `શું ${label} પર ₹${amount} નો ઓર્ડર કન્ફર્મ કરવો છે?`;
    case 'pa': return `ਕੀ ${label} 'ਤੇ ₹${amount} ਦਾ ਆਰਡਰ ਕਨਫਰਮ ਕਰਨਾ ਹੈ?`;
    case 'ml': return `${label}-ലേക്ക് ₹${amount} ഓർഡർ സ്ഥിരീകരിക്കണോ?`;
    case 'od': return `${label} ରେ ₹${amount} ର ଅର୍ଡର ନିଶ୍ଚିତ କରିବେ କି?`;
    default: return `Confirm ₹${amount} to ${label}?`;
  }
}

export function getNegativePrompt(lang?: string | null): string {
  const code = (lang || 'en').split('-')[0].toLowerCase();
  switch (code) {
    case 'hi': return 'कोई बात नहीं। क्या आप राशि या पता बदलना चाहते हैं, या रद्द करना चाहते हैं?';
    case 'bn': return 'কোনো সমস্যা নেই। আপনি কি পরিমাণ বা ঠিকানা পরিবর্তন করতে চান, নাকি বাতিল করবেন?';
    case 'kn': return 'ಯಾವುದೇ ತೊಂದರೆಯಿಲ್ಲ. ನೀವು ಮೊತ್ತ ಅಥವಾ ವಿಳಾಸವನ್ನು ಬದಲಾಯಿಸಲು ಬಯಸುವಿರಾ, ಅಥವಾ ರದ್ದುಗೊಳಿಸಲು ಬಯಸುವಿರಾ?';
    case 'ta': return 'பரவாயில்லை. தொகையையோ முகவரியையோ மாற்ற விரும்புகிறீர்களா, அல்லது ரத்து செய்யவா?';
    case 'te': return 'పర్వాలేదు. మీరు మొత్తం లేదా చిరునామా మార్చాలనుకుంటున్నారా, లేదా రద్దు చేయాలా?';
    case 'mr': return 'काही हरकत नाही. तुम्हाला रक्कम किंवा पत्ता बदलायचा आहे की रद्द करायचा आहे?';
    case 'gu': return 'કોઈ વાંધો નહીં. શું તમે રકમ અથવા સરનામું બદલવા માંગો છો, કે રદ કરવા માંગો છો?';
    case 'pa': return 'ਕੋਈ ਗੱਲ ਨਹੀਂ। ਕੀ ਤੁਸੀਂ ਰਕਮ ਜਾਂ ਪਤਾ ਬਦਲਣਾ ਚਾਹੁੰਦੇ ਹੋ, ਜਾਂ ਰੱਦ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?';
    case 'ml': return 'കുഴപ്പമില്ല. തുകയോ വിലാസമോ മാറ്റണോ, അതോ റദ്ദാക്കണോ?';
    case 'od': return 'କୌଣସି ଅସୁବିଧା ନାହିଁ। ଆପଣ ରାଶି ବା ଠିକଣା ବଦଳାଇବାକୁ ଚାହାଁନ୍ତି କି ବାତିଲ କରିବେ?';
    default: return 'No problem. Would you like to change the amount, change the address, or cancel?';
  }
}

export function getDonePrompt(amount: number, lang?: string | null): string {
  const code = (lang || 'en').split('-')[0].toLowerCase();
  switch (code) {
    case 'hi': return 'बढ़िया! कृपया ऑर्डर पूरा करने के लिए पेमेंट करें।';
    case 'bn': return 'চমৎকার! অর্ডার সম্পন্ন করতে অনুগ্রহ করে পেমেন্ট করুন।';
    case 'kn': return 'ಉತ್ತಮ! ದಯವಿಟ್ಟು ಆರ್ಡರ್ ಪೂರ್ಣಗೊಳಿಸಲು ಪಾವತಿ ಮಾಡಿ.';
    case 'ta': return 'அருமை! ஆர்டரை முடிக்க கட்டணத்தைச் செலுத்துங்கள்.';
    case 'te': return 'బాగుంది! దయచేసి ఆర్ಡర్ పూర్తి చేయడానికి చెల్లింపు చేయండి.';
    case 'mr': return 'उत्तम! ऑर्डर पूर्ण करण्यासाठी कृपया पेमेंट करा.';
    case 'gu': return 'સરસ! ઓર્ડર પૂર્ણ કરવા માટે કૃપા કરીને પેમેન્ટ કરો.';
    case 'pa': return 'ਬਹੁਤ ਵਧੀਆ! ਆਰਡਰ ਪੂਰਾ ਕਰਨ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਭੁਗਤਾਨ ਕਰੋ।';
    case 'ml': return 'നന്നായി! ഓർഡർ പൂർത്തിയാക്കാൻ ദയവായി പേയ്‌മെന്റ് ചെയ്യുക.';
    case 'od': return 'ବଢ଼ିଆ! ଅର୍ଡର ସମ୍ପୂର୍ଣ୍ଣ କରିବା ପାଇଁ ଦୟାକରି ପେମେଣ୍ଟ କରନ୍ତୁ।';
    default: return 'Done! Please complete the payment to place your order.';
  }
}

export function getIncompleteAddressPrompt(lang?: string | null): string {
  const code = (lang || 'en').split('-')[0].toLowerCase();
  switch (code) {
    case 'hi': return 'ऑर्डर के लिए कृपया अपना पूरा पता (मकान या फ्लैट नंबर) जोड़ें।';
    case 'bn': return 'ডেলিভারির জন্য অনুগ্রহ করে আপনার সম্পূর্ণ ঠিকানা (বাড়ি বা ফ্ল্যাট নম্বর) যোগ করুন।';
    case 'kn': return 'ಡೆಲಿವರಿಗೆ ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸಂಪೂರ್ಣ ವಿಳಾಸವನ್ನು (ಮನೆ ಅಥವಾ ಫ್ಲಾಟ್ ಸಂಖ್ಯೆ) ಸೇರಿಸಿ.';
    case 'ta': return 'டெலிவரிக்கு உங்கள் முழு முகவரியை (வீடு அல்லது பிளாட் எண்) சேர்க்கவும்.';
    case 'te': return 'డెలివరీ కోసం దయచేసి మీ పూర్తి చిరునామాను (ఇంటి లేదా ఫ్లాట్ నంబర్) జోడించండి.';
    case 'mr': return 'डिलिव्हरीसाठी कृपया तुमचा पूर्ण पत्ता (घर किंवा फ्लॅट नंबर) जोडा.';
    case 'gu': return 'ડિલિવરી માટે કૃપા કરીને તમારું પૂરું સરનામું (ઘર અથવા ફ્લેટ નંબર) ઉમેરો.';
    case 'pa': return 'ਡਿਲੀਵਰੀ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਪੂਰਾ ਪਤਾ (ਘਰ ਜਾਂ ਫਲੈਟ ਨੰਬਰ) ਸ਼ਾਮਲ ਕਰੋ।';
    case 'ml': return 'ഡെലിവറിക്കായി ദയവായി നിങ്ങളുടെ പൂർണ്ണ വിലാസം (വീട് അല്ലെങ്കിൽ ഫ്ലാറ്റ് നമ്പർ) ചേർക്കുക.';
    case 'od': return 'ଡେଲିଭରି ପାଇଁ ଦୟାକରି ଆପଣଙ୍କ ସମ୍ପୂର୍ଣ୍ଣ ଠିକଣା (ଘର ବା ଫ୍ଲାଟ୍ ନମ୍ବର) ଯୋଡ଼ନ୍ତୁ।';
    default: return 'Please add your full address (house or flat number) for delivery.';
  }
}

export function detectLanguageFromTranscript(transcript: string, currentFallback: string = 'en-IN'): string {
  if (!transcript) return currentFallback;
  const t = transcript.toLowerCase().trim();

  // 1. Bengali (Script + Phonetics / Romanized)
  if (
    /[ঀ-৿]/.test(t) ||
    /(taka|taaka|takar|taakar|takaa|takay|poisa|poisha|lagbe|laagbe|lage|laage|chai|chayi|chaye|hajar|hazaarr|hajaar|sho|shoh|panchsho|paanchsho|pachsho|pachso|pancho|eksho|duso|tinsho|charsho|choyso|shatsho|aatsho|noyso|amar|aamar|amake|aamake|amader|dorkar|dorkaar|pathan|pathao|pathiye|deben|din|koto|korun|koro|thik|ache|acche)/i.test(t)
  ) {
    return 'bn-IN';
  }

  // 2. Kannada
  if (
    /[ಀ-೿]/.test(t) ||
    /(beku|kodi|roopayi|saavira|nooru|ainuru|kalsi|badi|kodu|nanage|nange|namage|aithu)/i.test(t)
  ) {
    return 'kn-IN';
  }

  // 3. Tamil
  if (
    /[஀-௿]/.test(t) ||
    /(venum|kudu|roobai|aayiram|nooru|anuppu|anuppunga|pannunga|enakku|thanga)/i.test(t)
  ) {
    return 'ta-IN';
  }

  // 4. Telugu
  if (
    /[ఀ-౿]/.test(t) ||
    /(kavali|ivvandi|roopayalu|veylu|vandhalu|pampandi|cheyandi|naaku)/i.test(t)
  ) {
    return 'te-IN';
  }

  // 5. Gujarati
  if (
    /[઀-૿]/.test(t) ||
    /(joiye|aapo|rupiya|hajar|so|moklo|kari do|mane|tame)/i.test(t)
  ) {
    return 'gu-IN';
  }

  // 6. Punjabi
  if (
    /[਀-੿]/.test(t) ||
    /(chahida|chahidi|rupaiye|hajaar|bhej deo|kar dio|mainu|saanu)/i.test(t)
  ) {
    return 'pa-IN';
  }

  // 7. Malayalam
  if (
    /[ഀ-ൿ]/.test(t) ||
    /(venam|roopa|aayiram|ayakkoo|cheyyuka|enikku|tharan)/i.test(t)
  ) {
    return 'ml-IN';
  }

  // 8. Odia
  if (
    /[଀-୿]/.test(t) ||
    /(darkar|tanka|hajara|pathantu|karantu|mote)/i.test(t)
  ) {
    return 'od-IN';
  }

  // 9. Marathi vs Hindi (Devanagari / Romanized)
  if (/(पाहिजे|हजार|रुपये|मला|पाठवा|करा|नको|द्या)/i.test(t) || /(pahije|mala|pathva|dya)/i.test(t)) {
    return 'mr-IN';
  }

  if (
    /[ऀ-ॿ]/.test(t) ||
    /(chahiye|rupaye|rupay|hazaar|hazar|sau|mujhe|bhejo|karo|paanch|panch|bhej do|kar do|mera|meri|kripya)/i.test(t)
  ) {
    return 'hi-IN';
  }

  return currentFallback;
}

const CONVERSATION_SCRIPT: ScriptStep[] = [
  {
    stepIndex: 0,
    assistantPrompt: 'How much cash do you need?',
    userReply: '2000',
    updatedSlots: { amount: 2000 },
  },
  {
    stepIndex: 1,
    assistantPrompt: (slots) => `Delivering ₹${slots.amount || 2000} to ${getNormalizedAddressLabel(null, slots.addressLabel)}, is that right?`,
    userReply: 'yes',
    updatedSlots: (slots) => ({ addressLabel: getNormalizedAddressLabel(null, slots.addressLabel) }),
  },
  {
    stepIndex: 2,
    assistantPrompt: (slots) => `Confirm ₹${slots.amount || 2000} to ${getNormalizedAddressLabel(null, slots.addressLabel)}?`,
    userReply: 'yes',
    updatedSlots: { confirmed: true },
  },
  {
    stepIndex: 3,
    assistantPrompt: (slots) => `Done! Please complete the payment to place your order.`,
    userReply: '',
    updatedSlots: {},
    isFinal: true,
  },
];

/**
 * Address Turn Spoken Intent Matching Helper (Step 1)
 */
export interface AddressMatchResult {
  type: 'affirmative' | 'alternative_address' | 'negative_unmatched' | 'unclear';
  matchedLabel?: string;
  matchedAddress?: Address;
}

export function matchAddressTurnResponse(
  transcript: string,
  savedAddresses: Address[],
  currentLabel: string | null
): AddressMatchResult {
  const cleaned = (transcript || '').toLowerCase().trim();
  if (!cleaned) {
    return { type: 'unclear' };
  }

  // 1. Check if user named an alternative saved address
  for (const addr of savedAddresses) {
    const normalized = getNormalizedAddressLabel(addr);
    const rawLabel = (addr.label || '').trim();
    const area = (addr.area || '').trim();

    const candidates = [rawLabel, normalized, area].filter(
      (c) => c && c.toLowerCase() !== 'current location' && c !== 'your saved address'
    );

    for (const cand of candidates) {
      const candLower = cand.toLowerCase();
      const labelRegex = new RegExp(`(?:^|[\\s,.!?])${candLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[\\s,.!?])`, 'i');
      if (labelRegex.test(cleaned)) {
        return { type: 'alternative_address', matchedLabel: normalized, matchedAddress: addr };
      }
    }
  }

  // 2. Check for negative tokens
  const negativeRegex = /\b(no|nah|not|change|different|nahi|na|mat|lagbe na|dorkar nei|onno|অন্য|না|বদল|পরিবর্তন|beda|vendaam|vaddu|nako)\b/i;
  const isNegative = negativeRegex.test(cleaned);

  // 3. Check for affirmative tokens
  const affirmativeRegex = /\b(yes|yeah|yep|yup|haan|ha|sahi|correct|right|confirm|okay|ok|sure|proceed|deliver|theek|thik|kar do|kar do ji|chale|chalega|bhejo|bhej do|thik ache|hye|pathan|pathiye din|korun|din|হ্যাঁ|হাঁ|ঠিক|ঠিক আছে|পাঠিয়ে দিন|পাঠান|করুন|haudu|madi|sari|aam|aamam|avunu|sare|pampandi|hoy|ho)\b/i;
  const isAffirmative = affirmativeRegex.test(cleaned);

  if (isAffirmative && !isNegative) {
    return { type: 'affirmative', matchedLabel: getNormalizedAddressLabel(null, currentLabel) };
  }

  if (isNegative) {
    return { type: 'negative_unmatched' };
  }

  return { type: 'unclear' };
}

/**
 * Step 2: Safety-Critical Confirmation Turn Intent Matching
 */
export type ConfirmationMatchResult = {
  type: 'affirmative' | 'negative' | 'ambiguous';
  matchedToken?: string;
};

// Global exact-token matching helper for whole words/phrases with boundary isolation
function tokenMatches(text: string, token: string): boolean {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(?:^|[\\s,.!?])${escaped}(?:$|[\\s,.!?])`, 'i');
  return pattern.test(text);
}

const GLOBAL_NEGATIVE_TOKENS = [
  'no', 'nah', 'cancel', 'stop', 'wait', "don't", 'dont', 'change', 'modify',
  'nahi', 'nahin', 'na', 'mat karo', 'ruko', 'beda', 'vendaam', 'vaddu', 'nako', 'naa'
];

const AFFIRMATIVE_WHITELIST_BY_LANG: Record<string, string[]> = {
  'en-IN': ['yes', 'yeah', 'yep', 'yup', 'confirm', 'proceed', 'place order', 'place the order', 'go ahead', 'sure', 'okay', 'ok', 'do it', 'correct'],
  'hi-IN': ['à¤¹à¤¾à¤�', 'à¤¹à¤¾', 'à¤¹à¤¾à¤�à¤œà¥€', 'à¤¹à¤¾à¤œà¥€', 'à¤•à¤° à¤¦à¥‹', 'à¤•à¤° à¤¦à¥‹ à¤œà¥€', 'à¤­à¥‡à¤œ à¤¦à¥‹', 'à¤­à¥‡à¤œà¥‹', 'à¤‘à¤°à¥�à¤¡à¤° à¤•à¤° à¤¦à¥‹', 'à¤ªà¤•à¥�à¤•à¤¾', 'à¤¸à¤¹à¥€ à¤¹à¥ˆ', 'à¤ à¥€à¤• à¤¹à¥ˆ', 'haan', 'ha', 'haanji', 'haji', 'kar do', 'kar do ji', 'bhej do', 'bhejo', 'order kar do', 'pakka', 'sahi hai', 'theek hai', 'thik hai'],
  'bn-IN': ['à¦¹à§�à¦¯à¦¾à¦�', 'à¦¹à§�à¦¯à¦¾à¦� à¦•à¦°à§�à¦¨', 'à¦ªà¦¾à¦ à¦¿à§Ÿà§‡ à¦¦à¦¿à¦¨', 'à¦…à¦°à§�à¦¡à¦¾à¦° à¦•à¦°à§�à¦¨', 'à¦ à¦¿à¦• à¦†à¦›à§‡', 'haan', 'hye', 'pathiye din', 'thik ache', 'order koro', 'order korun'],
  'kn-IN': ['à²¹à³Œà²¦à³�', 'à²®à²¾à²¡à²¿', 'à²•à²³à³�à²¹à²¿à²¸à²¿', 'à²¸à²°à²¿', 'à²–à²šà²¿à²¤à²ªà²¡à²¿à²¸à²¿', 'haudu', 'madi', 'kaluhisi', 'sari', 'khachitapadisi', 'aithu'],
  'ta-IN': ['à®†à®®à¯�', 'à®†à®®à®¾à®®à¯�', 'à®šà®°à®¿', 'à®…à®©à¯�à®ªà¯�à®ªà¯�à®™à¯�à®•', 'à®ªà®£à¯�à®£à¯�à®™à¯�à®•', 'à®‰à®±à¯�à®¤à®¿ à®šà¯†à®¯à¯�', 'aam', 'aamam', 'sari', 'anuppunga', 'pannunga', 'confirm'],
  'te-IN': ['à°…à°µà±�à°¨à±�', 'à°¸à°°à±‡', 'à°ªà°‚à°ªà°‚à°¡à°¿', 'à°šà±‡à°¯à°‚à°¡à°¿', 'à°–à°°à°¾à°°à±� à°šà±‡à°¯à°‚à°¡à°¿', 'avunu', 'sare', 'pampandi', 'cheyandi'],
  'gu-IN': ['àª¹àª¾', 'àª¹àª¾àªœà«€', 'àª®à«‹àª•àª²à«‹', 'àª•àª°à«€ àª¦à«‹', 'àª¬àª°àª¾àª¬àª°', 'haa', 'haji', 'moklo', 'kari do', 'barabar'],
  'pa-IN': ['à¨¹à¨¾à¨‚', 'à¨¹à¨¾à¨‚à¨œà©€', 'à¨­à©‡à¨œ à¨¦à¨¿à¨“', 'à¨•à¨° à¨¦à¨¿à¨“', 'à¨ à©€à¨• à¨¹à©ˆ', 'haan', 'haanji', 'bhej deo', 'kar dio', 'theek hai'],
  'ml-IN': ['à´…à´¤àµ†', 'à´¶à´°à´¿', 'à´…à´¯à´•àµ�à´•àµ‚', 'à´šàµ†à´¯àµ�à´¯àµ�à´•', 'athe', 'shari', 'ayakkoo', 'cheyyuka'],
  'od-IN': ['à¬¹à¬�', 'à¬¹à¬� à¬†à¬œà­�à¬žà¬¾', 'à¬ªà¬ à¬¾à¬¨à­�à¬¤à­�', 'à¬•à¬°à¬¨à­�à¬¤à­�', 'à¬ à¬¿à¬• à¬…à¬›à¬¿', 'haan', 'hye', 'pathantu', 'karantu', 'thik achi'],
  'mr-IN': ['à¤¹à¥‹à¤¯', 'à¤¹à¥‹', 'à¤ªà¤¾à¤ à¤µà¤¾', 'à¤•à¤°à¤¾', 'à¤¨à¤•à¥�à¤•à¥€', 'à¤¬à¤°à¥‹à¤¬à¤°', 'hoy', 'ho', 'pathva', 'kara', 'nakki', 'barobar'],
};

const GLOBAL_AFFIRMATIVE_TOKENS = ['yes', 'yeah', 'yep', 'yup', 'confirm', 'proceed', 'place order', 'okay', 'ok', 'sure', 'haan', 'ha', 'correct'];

export function matchConfirmationTurnResponse(
  transcript: string,
  detectedLanguage?: string | null
): ConfirmationMatchResult {
  const cleaned = (transcript || '').trim();
  if (!cleaned) {
    return { type: 'ambiguous' };
  }

  // 1. Check Negative Whitelist FIRST (Highest Precedence)
  for (const negToken of GLOBAL_NEGATIVE_TOKENS) {
    if (tokenMatches(cleaned, negToken)) {
      console.log('[Confirmation Match DEBUG]', {
        transcript: cleaned,
        detectedLanguage: detectedLanguage || 'en-IN',
        matchedToken: negToken,
        classification: 'negative'
      });
      return { type: 'negative', matchedToken: negToken };
    }
  }

  // 2. Check Language-Specific Affirmative Whitelist (Zero Negative Matches)
  const langKey = detectedLanguage && AFFIRMATIVE_WHITELIST_BY_LANG[detectedLanguage] ? detectedLanguage : 'en-IN';
  const candidateAffirmatives = Array.from(new Set([
    ...(AFFIRMATIVE_WHITELIST_BY_LANG[langKey] || []),
    ...GLOBAL_AFFIRMATIVE_TOKENS
  ]));

  for (const affToken of candidateAffirmatives) {
    if (tokenMatches(cleaned, affToken)) {
      console.log('[Confirmation Match DEBUG]', {
        transcript: cleaned,
        detectedLanguage: langKey,
        matchedToken: affToken,
        classification: 'affirmative'
      });
      return { type: 'affirmative', matchedToken: affToken };
    }
  }

  // 3. Ambiguous / Non-Match
  console.log('[Confirmation Match DEBUG]', {
    transcript: cleaned,
    detectedLanguage: langKey,
    matchedToken: null,
    classification: 'ambiguous'
  });
  return { type: 'ambiguous' };
}


/**
 * Animated Aurora Purple Flow Canvas
 * Softened, single-hue #5260FE aurora plumes fading naturally into deep pitch black (#000000).
 */
const AuroraPurpleBackground: React.FC<{ conversationState: VoiceConversationState; isHold: boolean }> = ({
  conversationState,
  isHold,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = (canvas.width = window.innerWidth * dpr);
    let h = (canvas.height = window.innerHeight * dpr);

    // Drifting particle motes
    const PARTICLE_COUNT = 45;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * (h * 0.75),
      r: (0.4 + Math.random() * 1.4) * dpr,
      o: 0.12 + Math.random() * 0.55,
      vx: (Math.random() - 0.5) * 0.3 * dpr,
      vy: (0.1 + Math.random() * 0.4) * dpr,
    }));

    let time = 0;

    const handleResize = () => {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      time += 0.008;
      ctx.clearRect(0, 0, w, h);

      // 1. Base deep pitch black fill
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      // 2. Softened Multi-Node Organic Asymmetrical Plumes (#5260FE: rgb 82, 96, 254)
      // Plume 1: Main Center-Left Plume
      const p1x = w * (0.38 + Math.sin(time * 0.7) * 0.12);
      const p1y = h * (0.32 + Math.cos(time * 0.5) * 0.08);
      const p1r = Math.max(w, h) * (0.58 + Math.sin(time * 0.6) * 0.05);
      const g1 = ctx.createRadialGradient(p1x, p1y, 0, p1x, p1y, p1r);
      g1.addColorStop(0, 'rgba(82, 96, 254, 0.40)');
      g1.addColorStop(0.38, 'rgba(82, 96, 254, 0.20)');
      g1.addColorStop(0.72, 'rgba(82, 96, 254, 0.04)');
      g1.addColorStop(1, 'rgba(82, 96, 254, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      // Plume 2: Deep Right-Side Flow
      const p2x = w * (0.72 + Math.cos(time * 0.6) * 0.14);
      const p2y = h * (0.42 + Math.sin(time * 0.8) * 0.1);
      const p2r = Math.max(w, h) * (0.62 + Math.cos(time * 0.5) * 0.06);
      const g2 = ctx.createRadialGradient(p2x, p2y, 0, p2x, p2y, p2r);
      g2.addColorStop(0, 'rgba(82, 96, 254, 0.35)');
      g2.addColorStop(0.42, 'rgba(82, 96, 254, 0.16)');
      g2.addColorStop(0.78, 'rgba(82, 96, 254, 0.03)');
      g2.addColorStop(1, 'rgba(82, 96, 254, 0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // Plume 3: Center Ambient Tongue
      const stateBoost = isHold ? 0.15 : conversationState === 'speaking' ? 0.32 : conversationState === 'listening' ? 0.36 : conversationState === 'thinking' ? 0.40 : 0.25;
      const p3x = w * (0.5 + Math.sin(time * 0.9) * 0.08);
      const p3y = h * (0.50 + Math.cos(time * 0.7) * 0.07);
      const p3r = Math.max(w, h) * 0.46;
      const g3 = ctx.createRadialGradient(p3x, p3y, 0, p3x, p3y, p3r);
      g3.addColorStop(0, `rgba(82, 96, 254, ${stateBoost})`);
      g3.addColorStop(0.5, `rgba(82, 96, 254, ${stateBoost * 0.35})`);
      g3.addColorStop(0.85, 'rgba(82, 96, 254, 0)');
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, w, h);

      // Plume 4: Top-Left Header Wash
      const p4x = w * (0.15 + Math.cos(time * 0.4) * 0.1);
      const p4y = h * (0.12 + Math.sin(time * 0.6) * 0.06);
      const p4r = Math.max(w, h) * 0.45;
      const g4 = ctx.createRadialGradient(p4x, p4y, 0, p4x, p4y, p4r);
      g4.addColorStop(0, 'rgba(82, 96, 254, 0.30)');
      g4.addColorStop(0.55, 'rgba(82, 96, 254, 0.10)');
      g4.addColorStop(1, 'rgba(82, 96, 254, 0)');
      ctx.fillStyle = g4;
      ctx.fillRect(0, 0, w, h);

      // 3. Softened Animated Organic Undulating Wave Contour (Full Screen Fill)
      ctx.save();
      const waveGrad = ctx.createRadialGradient(w * 0.5 + Math.sin(time * 0.5) * (w * 0.2), 0, 0, w * 0.5 + Math.sin(time * 0.5) * (w * 0.2), 0, h * 0.85);
      waveGrad.addColorStop(0, 'rgba(82, 96, 254, 0.32)');
      waveGrad.addColorStop(0.45, 'rgba(82, 96, 254, 0.14)');
      waveGrad.addColorStop(0.8, 'rgba(82, 96, 254, 0.02)');
      waveGrad.addColorStop(1, 'rgba(82, 96, 254, 0)');
      ctx.fillStyle = waveGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // 4. Drifting Particle Motes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const verticalFade = Math.max(0, Math.min(1, 1 - (p.y / (h * 0.75))));
        if (verticalFade > 0.04) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.o * verticalFade * 0.75})`;
          ctx.fill();
        }
      }

      // 5. Seamless Full-Screen Bottom Darkness Dissolve (0 to h, completely eliminating any seams)
      const bottomDarkness = ctx.createLinearGradient(0, 0, 0, h);
      bottomDarkness.addColorStop(0, 'rgba(0, 0, 0, 0)');
      bottomDarkness.addColorStop(0.38, 'rgba(0, 0, 0, 0)');
      bottomDarkness.addColorStop(0.58, 'rgba(0, 0, 0, 0.45)');
      bottomDarkness.addColorStop(0.82, 'rgba(0, 0, 0, 0.92)');
      bottomDarkness.addColorStop(1, '#000000');
      ctx.fillStyle = bottomDarkness;
      ctx.fillRect(0, 0, w, h);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [conversationState, isHold]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
};

export const VoiceConversationOverlay: React.FC<VoiceConversationOverlayProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const navigate = useNavigate();
  const { profile } = useUser();
  const preferredLanguage = profile?.preferred_language || 'en';

  // Client-side state machine
  const [conversationState, setConversationState] = useState<VoiceConversationState>('speaking');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [slots, setSlots] = useState<SlotState>({
    amount: null,
    addressLabel: null,
    addressId: null,
    selectedAddress: null,
    confirmed: false,
    orderId: null,
  });
  const [isHold, setIsHold] = useState<boolean>(false);
  const [showDevControls, setShowDevControls] = useState<boolean>(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('en-IN');

  // Step 0 Real TTS & Voice Recording State
  const [activePromptText, setActivePromptText] = useState<string>('How much cash do you need?');
  const [retryCount, setRetryCount] = useState<number>(0);
  const [showManualFallback, setShowManualFallback] = useState<boolean>(false);
  const [manualAmountInput, setManualAmountInput] = useState<string>('');
  const [isProcessingVoice, setIsProcessingVoice] = useState<boolean>(false);

  // Step 1 Real Address Turn State
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [addressRetryCount, setAddressRetryCount] = useState<number>(0);
  const [showManualAddressFallback, setShowManualAddressFallback] = useState<boolean>(false);

  // Step 2 Real Confirmation Turn State
  const [confirmationRetryCount, setConfirmationRetryCount] = useState<number>(0);
  const [showManualConfirmFallback, setShowManualConfirmFallback] = useState<boolean>(false);
  const [showNegativeFallback, setShowNegativeFallback] = useState<boolean>(false);
  const [orderErrorMessage, setOrderErrorMessage] = useState<string | null>(null);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const isComponentMountedRef = useRef<boolean>(true);
  const prevIsOpenRef = useRef<boolean>(false);

  // Synchronize state-tracking refs to prevent stale closures in async callbacks
  const slotsRef = useRef<SlotState>(slots);
  slotsRef.current = slots;
  const currentStepIndexRef = useRef<number>(currentStepIndex);
  currentStepIndexRef.current = currentStepIndex;
  const retryCountRef = useRef<number>(retryCount);
  retryCountRef.current = retryCount;
  const addressRetryCountRef = useRef<number>(addressRetryCount);
  addressRetryCountRef.current = addressRetryCount;
  const confirmationRetryCountRef = useRef<number>(confirmationRetryCount);
  confirmationRetryCountRef.current = confirmationRetryCount;
  const preferredLanguageRef = useRef<string>(preferredLanguage);
  preferredLanguageRef.current = preferredLanguage;
  const detectedLanguageRef = useRef<string>(detectedLanguage);
  detectedLanguageRef.current = detectedLanguage;
  const isProcessingVoiceRef = useRef<boolean>(isProcessingVoice);
  isProcessingVoiceRef.current = isProcessingVoice;
  const savedAddressesRef = useRef<Address[]>(savedAddresses);
  savedAddressesRef.current = savedAddresses;

  // useVoiceRecorder hook captured via ref to decouple action functions from render churn
  const recorder = useVoiceRecorder({ maxDurationMs: 30000 });
  const recorderRef = useRef(recorder);
  recorderRef.current = recorder;

  useEffect(() => {
    isComponentMountedRef.current = true;
    return () => {
      isComponentMountedRef.current = false;
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.src = '';
        activeAudioRef.current = null;
      }
      recorderRef.current.cancelRecording();
    };
  }, []);

  const stopActiveAudio = useCallback(() => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = '';
      activeAudioRef.current = null;
    }
  }, []);

  // Real voice listening initiation
  const startListeningTurn = useCallback(async () => {
    if (!isComponentMountedRef.current) return;
    setConversationState('listening');
    await recorderRef.current.startRecording();
  }, []);

  // Real TTS synthesizer & player
  const speakPrompt = useCallback(async (text: string, onAudioEndCallback?: () => void) => {
    if (!isComponentMountedRef.current) return;
    stopActiveAudio();
    setConversationState('speaking');
    setActivePromptText(text);

    // Sanitize punctuation for TTS: replace em-dashes and double hyphens with clean commas so TTS sounds natural
    const cleanTtsText = text
      .replace(/[—–]/g, ', ')
      .replace(/--+/g, ', ')
      .replace(/\s+/g, ' ')
      .trim();

    try {
      const { data, error } = await supabase.functions.invoke('voice-order-tts', {
        body: {
          text: cleanTtsText,
          preferred_language: preferredLanguageRef.current,
          speaker: 'ritu',
        },
      });

      if (error || !data?.audioBase64) {
        if (onAudioEndCallback) {
          onAudioEndCallback();
        } else {
          startListeningTurn();
        }
        return;
      }

      const mimeType = data.mimeType || 'audio/wav';
      const audioUrl = `data:${mimeType};base64,${data.audioBase64}`;
      const audio = new Audio(audioUrl);
      activeAudioRef.current = audio;

      audio.onended = () => {
        activeAudioRef.current = null;
        if (onAudioEndCallback) {
          onAudioEndCallback();
        } else {
          startListeningTurn();
        }
      };

      audio.onerror = () => {
        activeAudioRef.current = null;
        if (onAudioEndCallback) {
          onAudioEndCallback();
        } else {
          startListeningTurn();
        }
      };

      await audio.play();
    } catch {
      if (onAudioEndCallback) {
        onAudioEndCallback();
      } else {
        startListeningTurn();
      }
    }
  }, [stopActiveAudio, startListeningTurn]);

  // Ambiguous/failed speech handler for Step 0 (Amount)
  const handleAmountFailure = useCallback((customMsg?: string) => {
    setIsProcessingVoice(false);
    const currentRetry = retryCountRef.current;
    const lang = detectedLanguageRef.current;
    if (currentRetry < 2) {
      setRetryCount(currentRetry + 1);
      const reaskSentence = customMsg || getAmountReaskPrompt(lang);
      speakPrompt(reaskSentence);
    } else {
      setShowManualFallback(true);
      setConversationState('idle');
      setActivePromptText('Please enter the cash amount below:');
    }
  }, [speakPrompt]);

  // Transition into Step 2 (Confirmation Turn)
  const enterConfirmationStep = useCallback((amount: number, addressLabel: string, activeLanguage?: string) => {
    stopActiveAudio();
    recorderRef.current.cancelRecording();
    setCurrentStepIndex(2);
    setConfirmationRetryCount(0);
    confirmationRetryCountRef.current = 0;
    setShowManualConfirmFallback(false);
    setShowNegativeFallback(false);
    setOrderErrorMessage(null);
    setCurrentTranscript('');
    const lang = activeLanguage || detectedLanguageRef.current;
    const promptText = getConfirmationPrompt(amount, getNormalizedAddressLabel(null, addressLabel), lang);
    speakPrompt(promptText);
  }, [stopActiveAudio, speakPrompt]);

  // Transition into Step 1 (Address Turn) with saved address lookup
  const enterAddressStep = useCallback(async (amount: number, activeLanguage?: string) => {
    stopActiveAudio();
    recorderRef.current.cancelRecording();
    setCurrentStepIndex(1);
    setShowManualAddressFallback(false);
    setShowManualConfirmFallback(false);
    setShowNegativeFallback(false);
    setOrderErrorMessage(null);
    setAddressRetryCount(0);
    setCurrentTranscript('');

    const lang = activeLanguage || detectedLanguageRef.current;
    const userId = profile?.id;
    let addresses: Address[] = [];

    if (userId) {
      try {
        const fetched = await fetchAddresses(userId);
        if (Array.isArray(fetched)) {
          addresses = fetched.filter(isAddressComplete);
        }
      } catch (err) {
        addresses = [];
      }
    }

    setSavedAddresses(addresses);
    savedAddressesRef.current = addresses;

    // Branch a: 0 complete saved addresses -> prompt user and route to add address
    if (addresses.length === 0) {
      const prompt0 = getIncompleteAddressPrompt(lang);
      speakPrompt(prompt0, () => {
        onClose();
        navigate(ROUTES.ADD_ADDRESS);
      });
      return;
    }

    // Branch b: 1 saved address -> auto-fill and confirm
    if (addresses.length === 1) {
      const singleLabel = getNormalizedAddressLabel(addresses[0]);
      setSlots((prev) => ({
        ...prev,
        addressLabel: singleLabel,
        addressId: addresses[0].id,
        selectedAddress: addresses[0],
      }));
      const prompt1 = getAddressPrompt(amount, singleLabel, false, lang);
      speakPrompt(prompt1);
      return;
    }

    // Branch c: 2+ saved addresses -> resolve default address
    const activeGlobal = useLocationStore.getState().activeAddress;
    let defaultAddr: Partial<Address> = addresses[0];

    if (activeGlobal && addresses.some((a) => a.id === activeGlobal.id || (a.label && a.label === activeGlobal.label))) {
      const found = addresses.find((a) => a.id === activeGlobal.id || (a.label && a.label === activeGlobal.label));
      if (found) defaultAddr = found;
    } else {
      const homeAddr = addresses.find((a) => (a.label || '').toLowerCase() === 'home');
      if (homeAddr) {
        defaultAddr = homeAddr;
      }
    }

    const defaultLabel = getNormalizedAddressLabel(defaultAddr);
    setSlots((prev) => ({
      ...prev,
      addressLabel: defaultLabel,
      addressId: defaultAddr.id || addresses[0]?.id,
      selectedAddress: defaultAddr as Address,
    }));
    const promptMultiple = getAddressPrompt(amount, defaultLabel, true, lang);
    speakPrompt(promptMultiple);
  }, [profile?.id, stopActiveAudio, speakPrompt, onClose]);

  // Ambiguous/failed speech handler for Step 1 (Address)
  const handleAddressFailure = useCallback((customReask?: string) => {
    setIsProcessingVoice(false);
    const currentRetry = addressRetryCountRef.current;
    const currentAmount = slotsRef.current.amount || 2000;
    const currentLabel = getNormalizedAddressLabel(null, slotsRef.current.addressLabel);
    const addressList = savedAddressesRef.current;

    if (currentRetry < 2) {
      setAddressRetryCount(currentRetry + 1);
      const reaskText = customReask || (addressList.length > 1
        ? getAddressPrompt(currentAmount, currentLabel, true, detectedLanguageRef.current)
        : getAddressPrompt(currentAmount, currentLabel, false, detectedLanguageRef.current));
      speakPrompt(reaskText);
    } else {
      // Retry cap reached -> Fall back to manual tap-to-select saved addresses UI
      setShowManualAddressFallback(true);
      setConversationState('idle');
      setActivePromptText('Please choose a delivery address:');
    }
  }, [speakPrompt]);

  // Real Order Creation (Called strictly on explicit confirmed affirmative in Step 2)
  const handleCreateRealCashOrder = useCallback(async () => {
    stopActiveAudio();
    recorderRef.current.cancelRecording();
    setIsProcessingVoice(true);
    setConversationState('thinking');
    setOrderErrorMessage(null);

    try {
      const user = profile;
      const userId = user?.id;
      const currentAmount = slotsRef.current.amount || 2000;

      if (!userId) {
        throw new Error('You must be logged in to place a cash order.');
      }

      // 1. Resolve address ID and address object
      const addressList = savedAddressesRef.current;
      let selectedAddr = slotsRef.current.selectedAddress 
        || addressList.find((a) => a.id === slotsRef.current.addressId) 
        || addressList[0];
      const addressId = selectedAddr?.id || slotsRef.current.addressId || '';

      // Resolve zone_id via check_service_availability RPC using address or location coordinates
      let zoneId: string | null = null;
      const targetLat = selectedAddr?.latitude || useLocationStore.getState().lat;
      const targetLng = selectedAddr?.longitude || useLocationStore.getState().lng;

      if (targetLat && targetLng) {
        const { data: resolvedZoneId } = await (supabase.rpc as any)('check_service_availability', {
          p_lat: Number(targetLat),
          p_lng: Number(targetLng),
        });
        if (resolvedZoneId) {
          zoneId = resolvedZoneId;
        }
      }

      // 2. Fetch server quote to prevent fee_mismatch error
      const { data: quoteData, error: quoteError } = await (supabase.rpc as any)('get_order_quote', {
        p_amount: Number(currentAmount),
        p_order_type: 'cash',
        p_distance_km: 0,
        p_service_amount: 0,
        p_user_id: userId,
      });

      if (quoteError || !quoteData) {
        console.error('[VoiceConfirmation DEBUG] get_order_quote failed:', quoteError);
        throw new Error(quoteError?.message || 'Failed to calculate order quote');
      }

      const deliveryFee = quoteData.delivery_fee || 0;
      const platformFee = quoteData.platform_fee || 0;
      const gst = quoteData.gst || 0;
      const totalPayable = quoteData.total_payable || (currentAmount + deliveryFee + platformFee + gst);

      // 3. Call create-cash-order edge function
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-cash-order', {
        body: {
          user_id: userId,
          amount: Number(currentAmount),
          total_payable: Number(totalPayable),
          delivery_fee: Number(deliveryFee),
          platform_fee: Number(platformFee),
          gst: Number(gst),
          tip: 0,
          reward_points: 0,
          address_id: addressId,
          zone_id: zoneId,
          city: selectedAddr?.city || 'Bengaluru',
          customer_phone: user?.phone || selectedAddr?.contact_phone || '',
          customer_name: user?.name || selectedAddr?.contact_name || 'Customer',
          customer_email: user?.email || 'customer@gridpe.in',
          scheduled_at: null,
        },
      });

      const resolvedOrderData = orderData?.payment_session_id 
        ? orderData 
        : orderData?.data?.payment_session_id 
          ? orderData.data 
          : orderData;

      if (orderError || !resolvedOrderData?.success) {
        let errorMsg = 'Failed to initiate cash order. Please try again.';
        try {
          const errBody = await (orderError as any)?.context?.json?.();
          if (errBody?.message) errorMsg = errBody.message;
          else if (errBody?.error) errorMsg = `Error: ${errBody.error}`;
        } catch {
          if (resolvedOrderData?.message) errorMsg = resolvedOrderData.message;
          else if (resolvedOrderData?.error) errorMsg = `Error: ${resolvedOrderData.error}`;
        }
        throw new Error(errorMsg);
      }

      // 4. Order created successfully! Advance to Step 3 (Done)
      const updatedSlots: SlotState = {
        ...slotsRef.current,
        confirmed: true,
        orderId: resolvedOrderData.cashfree_order_id,
      };
      setSlots(updatedSlots);
      slotsRef.current = updatedSlots;
      setCurrentStepIndex(3);
      setConversationState('speaking');
      const donePrompt = getDonePrompt(currentAmount, detectedLanguageRef.current);
      
      speakPrompt(donePrompt, () => {
        // Auto-navigate to payment summary upon speech completion
        setTimeout(() => {
          if (onComplete) {
            onComplete(updatedSlots);
          }
        }, 500);
      });
    } catch (err: any) {
      console.error('[VoiceConfirmation DEBUG] Order placement failed:', err);
      const errorText = err?.message || 'Failed to place cash order';
      setOrderErrorMessage(errorText);
      setConversationState('idle');
      setActivePromptText(`Order failed: ${errorText}`);
      speakPrompt(`Order failed: ${errorText}`);
    } finally {
      setIsProcessingVoice(false);
    }
  }, [profile, speakPrompt, onComplete, stopActiveAudio]);

  // Real voice processing: stop recording, convert to base64, call voice-cash-order
  const handleStopAndProcess = useCallback(async () => {
    if (isProcessingVoiceRef.current) return;
    setIsProcessingVoice(true);
    setConversationState('thinking');

    try {
      const blob = await recorderRef.current.stopRecording();
      if (!blob || blob.size === 0) {
        if (currentStepIndexRef.current === 0) {
          handleAmountFailure();
        } else if (currentStepIndexRef.current === 1) {
          handleAddressFailure();
        } else {
          // Step 2 ambiguous
          const currentRetry = confirmationRetryCountRef.current;
          const currentAmount = slotsRef.current.amount || 2000;
          const currentLabel = getNormalizedAddressLabel(null, slotsRef.current.addressLabel);
          if (currentRetry < 2) {
            setConfirmationRetryCount(currentRetry + 1);
            confirmationRetryCountRef.current = currentRetry + 1;
            speakPrompt(getConfirmationPrompt(currentAmount, currentLabel, detectedLanguageRef.current));
          } else {
            setShowManualConfirmFallback(true);
            setConversationState('idle');
            setActivePromptText(`Please tap below to confirm your order:`);
          }
        }
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Audio = reader.result as string;
          const { data, error } = await supabase.functions.invoke('voice-cash-order', {
            body: {
              audio: base64Audio,
              preferred_language: preferredLanguageRef.current,
              mime_type: blob.type || 'audio/webm',
            },
          });

          if (error || !data) {
            if (currentStepIndexRef.current === 0) {
              handleAmountFailure();
            } else if (currentStepIndexRef.current === 1) {
              handleAddressFailure();
            } else {
              const currentRetry = confirmationRetryCountRef.current;
              const currentAmount = slotsRef.current.amount || 2000;
              const currentLabel = getNormalizedAddressLabel(null, slotsRef.current.addressLabel);
              if (currentRetry < 2) {
                setConfirmationRetryCount(currentRetry + 1);
                confirmationRetryCountRef.current = currentRetry + 1;
                speakPrompt(getConfirmationPrompt(currentAmount, currentLabel, detectedLanguageRef.current));
              } else {
                setShowManualConfirmFallback(true);
                setConversationState('idle');
                setActivePromptText(`Please tap below to confirm your order:`);
              }
            }
            return;
          }

          const transcript = (data.transcript || '').trim();
          if (transcript) {
            setCurrentTranscript(transcript);
          }

          // Robust hybrid language detection
          const resolvedLanguage = detectLanguageFromTranscript(
            transcript,
            data.detectedLanguage || detectedLanguageRef.current || 'en-IN'
          );

          setDetectedLanguage(resolvedLanguage);
          detectedLanguageRef.current = resolvedLanguage;
          preferredLanguageRef.current = resolvedLanguage;

          // ================= STEP 0: AMOUNT TURN =================
          if (currentStepIndexRef.current === 0) {
            const extractedAmount = data.extractedAmount;
            if (typeof extractedAmount === 'number' && extractedAmount >= 500 && extractedAmount <= 100000) {
              setSlots((prev) => ({ ...prev, amount: extractedAmount }));
              setRetryCount(0);
              setShowManualFallback(false);
              // Advance to live Step 1 Address Turn
              const lang = data.detectedLanguage || detectedLanguageRef.current;
              enterAddressStep(extractedAmount, lang);
            } else {
              const lang = data.detectedLanguage || detectedLanguageRef.current;
              const minHint = getAmountMinHintPrompt(lang);
              handleAmountFailure(minHint);
            }
          }
          // ================= STEP 1: ADDRESS TURN =================
          else if (currentStepIndexRef.current === 1) {
            const currentLabel = slotsRef.current.addressLabel;
            const addressList = savedAddressesRef.current;
            const match = matchAddressTurnResponse(transcript, addressList, currentLabel);

            if (match.type === 'affirmative') {
              // User confirmed the proposed address -> enter Step 2
              const chosenLabel = match.matchedLabel || currentLabel || 'Home';
              setSlots((prev) => ({ ...prev, addressLabel: chosenLabel }));
              setAddressRetryCount(0);
              setShowManualAddressFallback(false);
              const lang = data.detectedLanguage || detectedLanguageRef.current;
              enterConfirmationStep(slotsRef.current.amount || 2000, chosenLabel, lang);
            } else if (match.type === 'alternative_address' && match.matchedLabel) {
              // User named a different saved address
              const matchedAddr = match.matchedAddress || addressList.find((a) => getNormalizedAddressLabel(a) === match.matchedLabel);
              setSlots((prev) => ({
                ...prev,
                addressLabel: match.matchedLabel!,
                addressId: matchedAddr?.id || prev.addressId,
                selectedAddress: matchedAddr || prev.selectedAddress,
              }));
              setAddressRetryCount(0);
              setShowManualAddressFallback(false);
              const lang = data.detectedLanguage || detectedLanguageRef.current;
              enterConfirmationStep(slotsRef.current.amount || 2000, match.matchedLabel!, lang);
            } else if (match.type === 'negative_unmatched') {
              // User said "no"
              if (addressList.length <= 1) {
                // 1-address case: go straight to manual fallback rather than re-asking
                setShowManualAddressFallback(true);
                setConversationState('idle');
                setActivePromptText('Please select or add a delivery address:');
              } else {
                // 2+ address case: list saved address labels
                const labelNames = addressList.map((a) => getNormalizedAddressLabel(a)).filter(Boolean).join(', ');
                const reaskMsg = labelNames
                  ? `I don't have that saved — did you mean ${labelNames}?`
                  : "Sorry, I couldn't match that address. Please choose from your saved addresses.";
                handleAddressFailure(reaskMsg);
              }
            } else {
              // Unclear utterance
              handleAddressFailure();
            }
          }
          // ================= STEP 2: CONFIRMATION TURN (SAFETY CRITICAL) =================
          else if (currentStepIndexRef.current === 2) {
            const match = matchConfirmationTurnResponse(transcript, detectedLanguageRef.current);

            if (match.type === 'affirmative') {
              setConfirmationRetryCount(0);
              setShowManualConfirmFallback(false);
              setShowNegativeFallback(false);
              await handleCreateRealCashOrder();
            } else if (match.type === 'negative') {
              setShowNegativeFallback(true);
              setConversationState('idle');
              const negPrompt = getNegativePrompt(detectedLanguageRef.current);
              setActivePromptText(negPrompt);
              speakPrompt(negPrompt);
            } else {
              // Ambiguous utterance
              const currentRetry = confirmationRetryCountRef.current;
              const currentAmount = slotsRef.current.amount || 2000;
              const currentLabel = getNormalizedAddressLabel(null, slotsRef.current.addressLabel);
              if (currentRetry < 2) {
                setConfirmationRetryCount(currentRetry + 1);
                confirmationRetryCountRef.current = currentRetry + 1;
                speakPrompt(getConfirmationPrompt(currentAmount, currentLabel, detectedLanguageRef.current));
              } else {
                setShowManualConfirmFallback(true);
                setConversationState('idle');
                setActivePromptText(`Please tap below to confirm your order of ₹${currentAmount}:`);
              }
            }
          }
        } catch {
          if (currentStepIndexRef.current === 0) {
            handleAmountFailure();
          } else if (currentStepIndexRef.current === 1) {
            handleAddressFailure();
          } else {
            const currentRetry = confirmationRetryCountRef.current;
            const currentAmount = slotsRef.current.amount || 2000;
            const currentLabel = getNormalizedAddressLabel(null, slotsRef.current.addressLabel);
            if (currentRetry < 2) {
              setConfirmationRetryCount(currentRetry + 1);
              confirmationRetryCountRef.current = currentRetry + 1;
              speakPrompt(getConfirmationPrompt(currentAmount, currentLabel, detectedLanguageRef.current));
            } else {
              setShowManualConfirmFallback(true);
              setConversationState('idle');
              setActivePromptText(`Please tap below to confirm your order of ₹${currentAmount}:`);
            }
          }
        } finally {
          setIsProcessingVoice(false);
        }
      };
      reader.readAsDataURL(blob);
    } catch {
      setIsProcessingVoice(false);
      if (currentStepIndexRef.current === 0) {
        handleAmountFailure();
      } else if (currentStepIndexRef.current === 1) {
        handleAddressFailure();
      }
    }
  }, [handleAmountFailure, enterAddressStep, handleAddressFailure, enterConfirmationStep, handleCreateRealCashOrder, speakPrompt]);

  // Manual fallback amount submission (after 2 failed voice re-asks)
  const handleManualAmountSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(manualAmountInput.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(val) && val >= 500 && val <= 100000) {
      setSlots((prev) => ({ ...prev, amount: val }));
      setShowManualFallback(false);
      setManualAmountInput('');
      setCurrentTranscript(`₹${val}`);
      enterAddressStep(val);
    }
  };

  // Manual address selection handler from fallback chip list
  const handleManualAddressSelect = (label: string) => {
    const normalized = getNormalizedAddressLabel(null, label);
    const matchedAddr = savedAddressesRef.current.find((a) => getNormalizedAddressLabel(a) === normalized);
    setSlots((prev) => ({
      ...prev,
      addressLabel: normalized,
      addressId: matchedAddr?.id || prev.addressId,
      selectedAddress: matchedAddr || prev.selectedAddress,
    }));
    setShowManualAddressFallback(false);
    setCurrentTranscript(normalized);
    enterConfirmationStep(slotsRef.current.amount || 2000, normalized);
  };

  // Full reset
  const handleReset = useCallback(() => {
    stopActiveAudio();
    recorderRef.current.cancelRecording();
    recorderRef.current.reset();
    setCurrentStepIndex(0);
    setConversationState('speaking');
    setSlots({
      amount: null,
      addressLabel: null,
      addressId: null,
      selectedAddress: null,
      confirmed: false,
      orderId: null,
    });
    setCurrentTranscript('');
    setIsHold(false);
    setRetryCount(0);
    setAddressRetryCount(0);
    setConfirmationRetryCount(0);
    setShowManualFallback(false);
    setShowManualAddressFallback(false);
    setShowManualConfirmFallback(false);
    setShowNegativeFallback(false);
    setOrderErrorMessage(null);
    setManualAmountInput('');
    setIsProcessingVoice(false);
    speakPrompt('How much cash do you need?');
  }, [stopActiveAudio, speakPrompt]);

  const handleEnd = useCallback(() => {
    stopActiveAudio();
    recorderRef.current.cancelRecording();
    recorderRef.current.reset();
    onClose();
  }, [stopActiveAudio, onClose]);

  // Jump directly to a step index in the script
  const goToStep = useCallback((stepIdx: number) => {
    stopActiveAudio();
    recorderRef.current.cancelRecording();
    const clampedIndex = Math.max(0, Math.min(stepIdx, CONVERSATION_SCRIPT.length - 1));
    setCurrentStepIndex(clampedIndex);

    const cumulativeSlots: SlotState = {
      amount: 2000,
      addressLabel: 'your saved address',
      addressId: null,
      selectedAddress: null,
      confirmed: false,
      orderId: null,
    };
    for (let i = 0; i < clampedIndex; i++) {
      const stepUpdates = typeof CONVERSATION_SCRIPT[i].updatedSlots === 'function'
        ? (CONVERSATION_SCRIPT[i].updatedSlots as (s: SlotState) => Partial<SlotState>)(cumulativeSlots)
        : CONVERSATION_SCRIPT[i].updatedSlots;
      Object.assign(cumulativeSlots, stepUpdates);
    }
    setSlots(cumulativeSlots);
    setCurrentTranscript('');
    setConversationState('speaking');
    setIsHold(false);
    setShowManualFallback(false);
    setShowManualAddressFallback(false);
    setShowManualConfirmFallback(false);
    setShowNegativeFallback(false);
    setOrderErrorMessage(null);

    if (clampedIndex === 0) {
      setRetryCount(0);
      speakPrompt('How much cash do you need?');
    } else if (clampedIndex === 1) {
      enterAddressStep(cumulativeSlots.amount || 2000);
    } else if (clampedIndex === 2) {
      enterConfirmationStep(cumulativeSlots.amount || 2000, cumulativeSlots.addressLabel || 'your saved address');
    }
  }, [stopActiveAudio, speakPrompt, enterAddressStep, enterConfirmationStep]);

  // Mock reply advance for Steps 2-3 (and dev simulation for Steps 0-1)
  const handleSimulateUserReply = useCallback(() => {
    stopActiveAudio();
    recorderRef.current.cancelRecording();
    const currentIdx = currentStepIndexRef.current;
    const step = CONVERSATION_SCRIPT[currentIdx];
    if (step.isFinal) {
      if (onComplete) {
        onComplete(slotsRef.current);
      }
      return;
    }

    // 1. Show user reply transcript and set state to 'thinking'
    setCurrentTranscript(step.userReply);
    setConversationState('thinking');

    // 2. Fill slot
    const currentSlots = slotsRef.current;
    const stepUpdates = typeof step.updatedSlots === 'function'
      ? step.updatedSlots(currentSlots)
      : step.updatedSlots;
    const updated = { ...currentSlots, ...stepUpdates };
    setSlots(updated);

    // 3. Advance to next step
    if (currentIdx < CONVERSATION_SCRIPT.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentStepIndex(nextIdx);
      setConversationState('speaking');
      if (CONVERSATION_SCRIPT[nextIdx].isFinal && onComplete) {
        onComplete(updated);
      }
    }
  }, [onComplete, stopActiveAudio]);

  // Reset and speak prompt strictly on false -> true open transitions
  useEffect(() => {
    if (!prevIsOpenRef.current && isOpen) {
      handleReset();
    } else if (prevIsOpenRef.current && !isOpen) {
      stopActiveAudio();
      recorderRef.current.cancelRecording();
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, handleReset, stopActiveAudio]);

  // Handle Hold toggle
  const toggleHold = () => {
    if (isHold) {
      setIsHold(false);
      if ((currentStepIndex === 0 || currentStepIndex === 1) && !showManualFallback && !showManualAddressFallback) {
        startListeningTurn();
      } else {
        setConversationState('speaking');
      }
    } else {
      setIsHold(true);
      stopActiveAudio();
      recorderRef.current.cancelRecording();
      setConversationState('idle');
    }
  };

  if (!isOpen) return null;

  const currentStep = CONVERSATION_SCRIPT[Math.min(currentStepIndex, CONVERSATION_SCRIPT.length - 1)];
  const resolvedPrompt = currentStepIndex === 0
    ? activePromptText
    : currentStepIndex === 1 && (activePromptText.includes('₹') || activePromptText.startsWith('Please ') || activePromptText.startsWith("I don't") || activePromptText.startsWith("You don't"))
      ? activePromptText
      : currentStepIndex === 2 && (activePromptText.includes('₹') || activePromptText.startsWith('No problem') || activePromptText.startsWith('कोई बात') || activePromptText.startsWith('Order failed:') || activePromptText.startsWith('Please tap'))
        ? activePromptText
        : currentStepIndex === 3
          ? getDonePrompt(slots.amount || 2000, detectedLanguage)
          : typeof currentStep.assistantPrompt === 'function'
            ? currentStep.assistantPrompt(slots)
            : currentStep.assistantPrompt;

  const getOrbState = (): 'working' | 'listening' | 'composing' | 'breathing' => {
    switch (conversationState) {
      case 'listening':
        return 'listening';
      case 'thinking':
        return 'working';
      case 'speaking':
        return 'composing';
      case 'idle':
      default:
        return 'breathing';
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex flex-col justify-between overflow-hidden select-none bg-[#000000] font-satoshi"
        style={{
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
        }}
      >
        {/* ================= HORIZONTAL TOP-TO-BOTTOM ANIMATED PURPLE AURORA CANOPY (#5260FE) ================= */}
        <AuroraPurpleBackground conversationState={conversationState} isHold={isHold} />

        {/* ================= SUBTLE CINEMATIC FILM GRAIN TEXTURE ================= */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay z-[2]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
          aria-hidden="true"
        />

        {/* ================= TOP HEADER BAR (Minimal: Dev Settings Only) ================= */}
        <div className="relative z-10 flex items-center justify-end px-6 pt-12 pb-2 safe-top">
          <button
            type="button"
            onClick={() => setShowDevControls((prev) => !prev)}
            aria-label="Toggle Dev Controls"
            title="Toggle Dev Scaffolding Panel"
            className={`p-2 rounded-full transition-all duration-200 active:scale-90 cursor-pointer ${
              showDevControls
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white border border-white/10'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* ================= CENTER SECTION (ThinkingOrb + Prompt + Dynamic Interactions) ================= */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-sm mx-auto w-full text-center -translate-y-6 sm:-translate-y-8">

          {/* ThinkingOrb with luminous ambient glow behind it (scaled to 100px) */}
          <div 
            onClick={() => {
              if ((currentStepIndex === 0 || currentStepIndex === 1 || currentStepIndex === 2) && conversationState === 'listening' && recorder.isRecording) {
                handleStopAndProcess();
              }
            }}
            className={`relative mb-7 flex items-center justify-center w-[100px] h-[100px] ${
              (currentStepIndex === 0 || currentStepIndex === 1 || currentStepIndex === 2) && conversationState === 'listening' ? 'cursor-pointer' : ''
            }`}
          >
            {/* Tier 1: Wide Outer Radiant Halo (220px) */}
            <motion.div
              animate={{
                scale: conversationState === 'speaking' ? [1, 1.25, 1] : conversationState === 'listening' ? [1, 1.35, 1] : conversationState === 'thinking' ? [1.1, 1.45, 1.1] : [0.95, 1.15, 0.95],
                opacity: isHold ? 0.35 : conversationState === 'thinking' ? [0.8, 1, 0.8] : conversationState === 'listening' ? [0.75, 0.95, 0.75] : [0.6, 0.85, 0.6],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-14 rounded-full pointer-events-none blur-2xl"
              style={{
                background: 'radial-gradient(circle, rgba(82, 96, 254, 0.75) 0%, rgba(82, 96, 254, 0.35) 45%, transparent 72%)',
              }}
            />

            {/* Tier 2: Focused Mid-Core Glow (140px) */}
            <motion.div
              animate={{
                scale: conversationState === 'speaking' ? [1, 1.18, 1] : [1, 1.1, 1],
                opacity: isHold ? 0.4 : [0.7, 0.95, 0.7],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-5 rounded-full pointer-events-none blur-lg"
              style={{
                background: 'radial-gradient(circle, rgba(82, 96, 254, 0.9) 0%, rgba(82, 96, 254, 0.5) 55%, transparent 75%)',
              }}
            />

            {/* ThinkingOrb from 'thinking-orbs' scaled to 100px with photon drop-shadow */}
            <div 
              className="relative z-10"
              style={{ 
                transform: 'scale(1.5625)', 
                transformOrigin: 'center',
                filter: 'drop-shadow(0 0 16px rgba(82, 96, 254, 0.75)) drop-shadow(0 0 32px rgba(82, 96, 254, 0.45))',
              }}
            >
              <ThinkingOrb
                state={getOrbState()}
                size={64}
                speed={0.70}
                theme="dark"
              />
            </div>
          </div>

          {/* Single Assistant Prompt Text */}
          <motion.div
            key={resolvedPrompt}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-5"
          >
            <h1 className="text-[20px] sm:text-[22px] font-medium font-satoshi text-white/95 tracking-normal leading-[1.35] text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
              {resolvedPrompt}
            </h1>
          </motion.div>

          {/* Step 0: Manual Input Fallback UI (amount input) */}
          {showManualFallback && currentStepIndex === 0 && (
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleManualAmountSubmit}
              className="w-full max-w-xs flex flex-col items-center gap-3"
            >
              <div className="relative w-full">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 font-medium text-[16px]">
                  ₹
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 2000"
                  min="500"
                  max="100000"
                  value={manualAmountInput}
                  onChange={(e) => setManualAmountInput(e.target.value)}
                  autoFocus
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/[0.08] border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#5260FE] text-[15px] font-satoshi text-center"
                />
              </div>
              <button
                type="submit"
                disabled={!manualAmountInput || parseInt(manualAmountInput, 10) < 500}
                className="w-full py-2.5 px-4 rounded-xl bg-[#5260FE] hover:bg-[#5260FE]/90 disabled:opacity-40 text-white font-medium text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#5260FE]/25 font-satoshi"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Amount</span>
              </button>
            </motion.form>
          )}

          {/* Step 1: Manual Address Fallback UI (tap-to-select saved address chips) */}
          {showManualAddressFallback && currentStepIndex === 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-xs flex flex-col items-center gap-2.5"
            >
              {savedAddresses.length > 0 ? (
                savedAddresses.map((addr) => {
                  const tag = getNormalizedAddressLabel(addr);
                  const summary = `${addr.apartment ? addr.apartment + ', ' : ''}${addr.area || addr.city || ''}`;
                  return (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleManualAddressSelect(tag)}
                      className="w-full p-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-left flex items-start gap-2.5 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <MapPin className="w-4 h-4 text-[#8E97FD] shrink-0 mt-0.5" />
                      <div className="flex-1 overflow-hidden">
                        <div className="text-[13px] font-semibold text-white truncate">{tag}</div>
                        {summary && <div className="text-[11px] text-white/60 truncate">{summary}</div>}
                      </div>
                    </button>
                  );
                })
              ) : (
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="w-full p-3 rounded-xl bg-[#5260FE] text-white font-medium text-[13px] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Address in App</span>
                </button>
              )}
            </motion.div>
          )}

          {/* Step 2: Manual Confirm Fallback Button */}
          {showManualConfirmFallback && currentStepIndex === 2 && !orderErrorMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-xs flex flex-col items-center gap-3"
            >
              <button
                type="button"
                onClick={() => handleCreateRealCashOrder()}
                className="w-full py-3 px-4 rounded-xl bg-[#5260FE] hover:bg-[#5260FE]/90 text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#5260FE]/25 font-satoshi active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Place Order (₹{slots.amount || 2000})</span>
              </button>
            </motion.div>
          )}

          {/* Step 2: Negative Fallback Options (Change Amount / Change Address / Cancel) */}
          {showNegativeFallback && currentStepIndex === 2 && !orderErrorMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-xs flex flex-col items-center gap-2.5"
            >
              <button
                type="button"
                onClick={() => goToStep(0)}
                className="w-full py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white font-medium text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Change Amount</span>
              </button>
              <button
                type="button"
                onClick={() => enterAddressStep(slots.amount || 2000)}
                className="w-full py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white font-medium text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Change Address</span>
              </button>
              <button
                type="button"
                onClick={() => onClose()}
                className="w-full py-2.5 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 font-medium text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Cancel & Exit</span>
              </button>
            </motion.div>
          )}

          {/* Step 2: Order Creation Error Display */}
          {orderErrorMessage && currentStepIndex === 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-xs flex flex-col items-center gap-2.5"
            >
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-[12px] text-center w-full">
                {orderErrorMessage}
              </div>
              <button
                type="button"
                onClick={() => handleCreateRealCashOrder()}
                className="w-full py-2.5 px-4 rounded-xl bg-[#5260FE] hover:bg-[#5260FE]/90 text-white font-medium text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Order</span>
              </button>
              <button
                type="button"
                onClick={() => onClose()}
                className="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-[12px] transition-all cursor-pointer"
              >
                <span>Exit</span>
              </button>
            </motion.div>
          )}

          {/* Step 3: Done / Proceed to Payment Button */}
          {currentStepIndex === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-xs flex flex-col items-center gap-3 mt-2"
            >
              <button
                type="button"
                onClick={() => {
                  if (onComplete) {
                    onComplete(slotsRef.current);
                  }
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#5260FE] hover:bg-[#5260FE]/90 text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#5260FE]/25 font-satoshi active:scale-95"
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* User Spoken Transcript / Status Pill */}
          {!showManualFallback && !showManualAddressFallback && !showManualConfirmFallback && !showNegativeFallback && !orderErrorMessage && currentStepIndex !== 3 && (
            <div className="min-h-[48px] flex flex-col items-center justify-center w-full gap-2">
              <AnimatePresence mode="wait">
                {currentTranscript ? (
                  <motion.div
                    key={currentTranscript}
                    initial={{ opacity: 0, scale: 0.95, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    className="px-4 py-2 rounded-2xl bg-white/[0.08] border border-white/[0.12] backdrop-blur-xl shadow-lg inline-flex items-center gap-2"
                  >
                    <Mic className="w-3.5 h-3.5 text-[#8E97FD] animate-pulse shrink-0" />
                    <span className="text-[14px] text-white/95 font-normal italic font-satoshi">
                      &ldquo;{currentTranscript}&rdquo;
                    </span>
                  </motion.div>
                ) : conversationState === 'listening' ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-2.5"
                  >
                    <div className="inline-flex items-center gap-2 text-white/60 text-[13px] font-normal font-satoshi">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5260FE] animate-ping" />
                      <span>Speak your answer now...</span>
                    </div>

                    {(currentStepIndex === 0 || currentStepIndex === 1 || currentStepIndex === 2) && recorder.isRecording && (
                      <button
                        type="button"
                        onClick={handleStopAndProcess}
                        className="px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white/90 hover:text-white text-[12px] font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm font-satoshi"
                      >
                        <Square className="w-3 h-3 fill-white/80 text-white/80" />
                        <span>Tap when done speaking</span>
                      </button>
                    )}
                  </motion.div>
                ) : conversationState === 'thinking' ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="inline-flex items-center gap-2 text-[#8E97FD] text-[13px] font-medium font-satoshi"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing response...</span>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )}
        </div>


        {/* ================= BOTTOM CONTROLS (Clean Circular Buttons) ================= */}
        <div className="relative z-10 px-6 pb-12 safe-bottom flex flex-col items-center gap-3.5">
          
          {/* Circular Action Icons: Hold & End */}
          <div className="flex items-center justify-center gap-6">
            {/* Hold Button (Clean Frosted Circle, No Glow) */}
            <button
              type="button"
              onClick={toggleHold}
              aria-label={isHold ? 'Resume conversation' : 'Hold conversation'}
              title={isHold ? 'Resume' : 'Hold'}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 border backdrop-blur-2xl cursor-pointer ${
                isHold
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  : 'bg-white/[0.08] hover:bg-white/[0.14] text-white/80 hover:text-white border-white/[0.12]'
              }`}
            >
              {isHold ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>

            {/* End Call Button (Clean Red Circle, No Glow — Also Closes Overlay) */}
            <button
              type="button"
              onClick={handleEnd}
              aria-label="End conversation and close"
              title="End conversation"
              className="w-12 h-12 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/35 text-red-400 hover:text-red-300 flex items-center justify-center transition-all duration-200 active:scale-90 backdrop-blur-2xl cursor-pointer"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>

          {/* ================= DEV TEST SCAFFOLDING PANEL (TOGGLEABLE) ================= */}
          <AnimatePresence>
            {showDevControls && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-sm rounded-2xl p-3.5 bg-black/90 border border-amber-500/30 backdrop-blur-2xl shadow-2xl mt-1 font-satoshi"
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sliders className="w-3 h-3" /> Dev Test Scaffolding
                  </span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] text-white/60 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset to Step 1
                  </button>
                </div>

                {/* Step Advance Trigger */}
                {!currentStep.isFinal && (
                  <button
                    type="button"
                    onClick={handleSimulateUserReply}
                    className="w-full mb-2.5 py-2 px-3 rounded-xl bg-[#5260FE]/35 hover:bg-[#5260FE]/50 border border-[#5260FE]/40 text-white text-[12px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-sm font-satoshi"
                  >
                    <span>Simulate Mock Reply: &ldquo;{currentStep.userReply}&rdquo;</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Step Jump Grid */}
                <div className="mb-2">
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1 font-semibold">
                    Script Steps:
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {CONVERSATION_SCRIPT.map((step, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => goToStep(idx)}
                        className={`px-2 py-1 rounded-lg text-[10.5px] font-medium border transition-all cursor-pointer font-satoshi ${
                          currentStepIndex === idx
                            ? 'bg-[#5260FE]/30 text-[#C4C9FE] border-[#5260FE]/60 font-bold'
                            : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        Step {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orb State Force Buttons (The 4 exact requested states) */}
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1 font-semibold">
                    Orb State (Exact 4 Presets):
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: 'Breathing', state: 'idle' as const },
                      { label: 'Listening', state: 'listening' as const },
                      { label: 'Composing', state: 'speaking' as const },
                      { label: 'Working', state: 'thinking' as const },
                    ].map(({ label, state }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setConversationState(state)}
                        className={`px-2 py-1 rounded-lg text-[10.5px] font-medium capitalize border transition-all cursor-pointer font-satoshi ${
                          conversationState === state
                            ? 'bg-amber-500/25 text-amber-200 border-amber-500/50 font-bold'
                            : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </AnimatePresence>
  );
};

export default VoiceConversationOverlay;
