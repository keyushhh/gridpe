import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { OrderMessage } from '@/types/chat';

export function useOrderChat(orderId: string | null, isOpen: boolean = false) {
  const { profile } = useUser();
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!orderId || !isMountedRef.current) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke(
        'get-chat-messages',
        { body: { order_id: orderId } }
      );
      if (error) throw error;
      if (!isMountedRef.current) return;
      setMessages(data?.messages ?? []);
    } catch (err) {
      console.error('[useOrderChat] fetchMessages failed:', err);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!orderId || !isOpen) return;
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [orderId, isOpen, fetchMessages]);

  const sendMessage = async (message: string) => {
    if (!orderId) return;
    
    let senderId = profile?.id;
    if (!senderId) {
      const { data: { user: freshUser } } = await supabase.auth.getUser();
      senderId = freshUser?.id;
    }
    if (!senderId) return;
    
    setIsSending(true);
    
    // We invoke the edge function instead of direct insert
    try {
      const { error } = await supabase.functions.invoke('send-chat-message', {
        body: {
          order_id: orderId,
          sender_type: 'customer',
          sender_id: senderId,
          message,
        },
      });

      if (error) {
        console.error('Error sending message:', error);
      }

      await fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    } finally {
      if (isMountedRef.current) setIsSending(false);
    }
  };

  const markMessagesRead = useCallback(async () => {
    // TODO: Implement via edge function once Supabase Auth is live
    // Direct table update blocked by RLS in dev (no auth session)
  }, []);

  return {
    messages,
    unreadCount,
    loading,
    isSending,
    sendMessage,
    markMessagesRead,
  };
}
