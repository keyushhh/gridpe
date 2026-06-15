import React, { useEffect, useRef } from 'react';
import { useOrderChat } from '@/hooks/useOrderChat';
import { CUSTOMER_QUICK_REPLIES } from '@/types/database';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';

interface CustomerChatSheetProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}

export default function CustomerChatSheet({ 
  isOpen, onClose, orderId 
}: CustomerChatSheetProps) {
  const { messages, loading, isSending, sendMessage, 
          markMessagesRead } = useOrderChat(orderId, isOpen);
  const isDarkMode = useIsDarkMode();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark messages read when opened
  useEffect(() => {
    if (isOpen) markMessagesRead();
  }, [isOpen, markMessagesRead]);

  if (!isOpen) return null;

  return (
    <>
      {/* Fixed backdrop */}
      <div 
        className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      {/* Sheet card */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-[151] flex flex-col rounded-t-[32px] overflow-hidden h-[70vh] ${isDarkMode ? 'bg-[#0A0A0A]' : 'bg-white'}`}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-[48px] h-[1.5px] rounded-full bg-black/20 dark:bg-white/20" />
        </div>
        
        {/* Header row */}
        <div className="px-5 pt-2 pb-3 flex items-center justify-between shrink-0 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3">
            {/* Rider avatar placeholder */}
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold font-satoshi text-foreground">Chat with Rider</p>
              <p className="text-[11px] font-satoshi text-muted-foreground">
                Delivery partner
              </p>
            </div>
          </div>
          <button onClick={onClose} 
            className="text-[13px] font-medium font-satoshi text-muted-foreground px-3 py-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            Close
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 px-5 pt-4 pb-2 overflow-y-auto no-scrollbar flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 pb-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <p className="text-[13px] font-satoshi text-muted-foreground text-center">No messages yet.</p>
              <p className="text-[12px] font-satoshi text-muted-foreground/60 text-center">The rider will message you here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-[2px]">
              {messages.map((msg, index) => {
                const isCustomer = msg.sender_type === 'customer';
                const nextMsg = messages[index + 1];
                const isLastInGroup = !nextMsg || nextMsg.sender_type !== msg.sender_type;
                const prevMsg = messages[index - 1];
                const isConsecutive = prevMsg && prevMsg.sender_type === msg.sender_type;
                
                return (
                  <div key={msg.id} className={`flex items-end gap-2 w-full mb-[2px] ${isCustomer ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Avatar — only show for last in group */}
                    {!isCustomer && (
                      <div className={`w-6 h-6 rounded-full shrink-0 bg-primary/10 flex items-center justify-center ${!isLastInGroup ? 'invisible' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-primary" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                        </svg>
                      </div>
                    )}
                    
                    {/* Bubble */}
                    <div className={`
                      max-w-[75%] px-4 py-2.5 flex flex-col gap-1
                      transition-colors
                      ${isCustomer 
                        ? `bg-primary text-white
                           rounded-2xl
                           ${isConsecutive ? 'rounded-tr-md' : ''}
                           ${!isLastInGroup ? 'rounded-br-md' : 'rounded-br-sm'}`
                        : `${isDarkMode 
                            ? 'bg-[#1A1A1A] border border-white/5' 
                            : 'bg-[#F7F8FA] border border-gray-100'}
                           rounded-2xl
                           ${isConsecutive ? 'rounded-tl-md' : ''}
                           ${!isLastInGroup ? 'rounded-bl-md' : 'rounded-bl-sm'}`
                      }
                      shadow-sm
                    `}>
                      <p className={`text-[14px] font-normal font-satoshi leading-snug ${isCustomer ? 'text-white' : isDarkMode ? 'text-white/90' : 'text-black'}`}>
                        {msg.message}
                      </p>
                      <p className={`text-[11px] font-satoshi self-end ${isCustomer ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Quick replies section */}
        <div className={`px-4 py-3 shrink-0 border-t ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
          <div className="flex flex-wrap gap-2">
            {CUSTOMER_QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                disabled={isSending}
                onClick={async () => {
                  if (isSending || !orderId) return;
                  await sendMessage(reply);
                }}
                className={`
                  rounded-full border text-[12px] font-medium 
                  font-satoshi px-3 py-1.5 transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${isDarkMode
                    ? 'border-white/10 bg-white/5 text-white/80 active:bg-white/10'
                    : 'border-primary/20 bg-primary/5 text-primary active:bg-primary/10'
                  }
                `}
              >
                {reply}
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
