import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';

interface DevModeOverlayProps {
  orderId?: string;
  isFx?: boolean;
}

const DevModeOverlay: React.FC<DevModeOverlayProps> = ({ orderId, isFx = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile, refreshBalance } = useUser();
  const { showToaster } = useCustomToaster();
  const navigate = useNavigate();
  const [balances, setBalances] = useState({ available: 0, held: 0 });

  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

  useEffect(() => {
    if (isDevMode && isOpen && profile?.id) {
      fetchBalances();
    }
  }, [isOpen, profile?.id]);

  const fetchBalances = async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from('wallets')
      .select('available_balance, held_balance')
      .eq('user_id', profile.id)
      .single();

    if (data) {
      setBalances({
        available: data.available_balance,
        held: data.held_balance,
      });
    }
  };

  const handleMarkDelivered = async () => {
    if (!orderId || !profile?.id) return;
    try {
      const rpcName = isFx ? 'complete_fx_order' : 'complete_cash_order';
      const { data, error } = await supabase.rpc(rpcName, {
        p_order_id: orderId,
        p_user_id: profile.id,
      });

      if (error) throw error;
      const result = data as { success: boolean; error?: string } | null;
      if (result?.success === false) throw new Error(result.error);

      showToaster('Order marked delivered!', 'success');
      await refreshBalance();
      await fetchBalances();

      // Navigate to order-delivered screen
      setTimeout(() => {
        navigate(ROUTES.ORDER_DELIVERED, { state: { orderId } });
      }, 1000);
    } catch (err: any) {
      showToaster(err.message, 'error');
    }
  };

  const handleCancelOrder = async () => {
    if (!orderId || !profile?.id) return;
    try {
      const { data, error } = await supabase.rpc('cancel_order', {
        p_order_id: orderId,
        p_user_id: profile.id,
        p_cancel_reason_type: 'Dev Mode Cancellation',
        p_cancel_reason_text: 'Cancelled via Dev Overlay',
      });

      if (error) throw error;
      const result = data as { success: boolean; error?: string } | null;
      if (result?.success === false) throw new Error(result.error);

      showToaster('Order cancelled!', 'success');
      await refreshBalance();
      await fetchBalances();
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      showToaster(err.message, 'error');
    }
  };

  const handleReleaseHold = async () => {
    if (!profile?.id) return;
    try {
      const { error } = await supabase
        .from('wallets')
        .update({ held_balance: 0 })
        .eq('user_id', profile.id);

      if (error) throw error;

      showToaster('Hold released (emergency)!', 'success');
      await refreshBalance();
      await fetchBalances();
    } catch (err: any) {
      showToaster(err.message, 'error');
    }
  };

  if (!isDevMode) return null;

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            backgroundColor: '#FF4500',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
          }}
        >
          🛠 Dev
        </button>
      ) : (
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '20px',
            borderRadius: '16px',
            width: '300px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.7)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#5260FE' }}>
              Dev Controls
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              fontSize: '13px',
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>Order ID:</span>
              <span style={{ fontFamily: 'monospace' }}>
                {orderId ? orderId.slice(0, 8) : 'None'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>Available:</span>
              <span style={{ fontWeight: 'bold' }}>
                ₹{balances.available.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>Held:</span>
              <span style={{ fontWeight: 'bold', color: balances.held > 0 ? '#f59e0b' : '#888' }}>
                ₹{balances.held.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={handleMarkDelivered}
              disabled={!orderId}
              style={{
                padding: '12px',
                backgroundColor: orderId ? '#22c55e' : '#1e293b',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: orderId ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                opacity: orderId ? 1 : 0.5,
              }}
            >
              Mark Delivered
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={!orderId}
              style={{
                padding: '12px',
                backgroundColor: orderId ? '#ef4444' : '#1e293b',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: orderId ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                opacity: orderId ? 1 : 0.5,
              }}
            >
              Cancel Order
            </button>
            <button
              onClick={handleReleaseHold}
              style={{
                padding: '12px',
                backgroundColor: 'transparent',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                color: '#f59e0b',
                cursor: 'pointer',
                fontWeight: 'bold',
                marginTop: '8px',
              }}
            >
              Release Hold (Emergency)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevModeOverlay;
