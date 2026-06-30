import { supabase } from './supabase';
import { olc } from '@/utils/olc';
import { Address } from '@/types';
import { crashlytics } from '@/lib/crashlytics';
export type { Address };

/**
 * Ensures a Plus Code is in global format.
 * If a short code is provided, it uses the provided lat/lng as context to expand it.
 */
export const ensureGlobalPlusCode = (
  plusCode: string | null,
  lat: number,
  lng: number
): string | null => {
  if (!plusCode) return null;

  try {
    if (olc.isFull(plusCode)) return plusCode.toUpperCase();

    // If it's a short code, expand it
    if (olc.isShort(plusCode)) {
      return olc.recoverNearest(plusCode, lat, lng).toUpperCase();
    }
  } catch (err) {
    if (import.meta.env.DEV) { console.error('Plus Code validation/expansion failed:', err); }
    crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), 'Plus Code validation/expansion failed');
  }

  return plusCode;
};

/**
 * Reliably fetches the current user ID.
 * Uses getUser() for security as recommended by Supabase for RLS verification.
 */
export const getAuthUserId = async (): Promise<string | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (err) {
    if (import.meta.env.DEV) { console.error('Failed to get auth user:', err); }
    crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), 'Failed to get auth user');
    return null;
  }
};

export const fetchAddresses = async (userId: string) => {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Address[];
};

export const createAddress = async (address: Omit<Address, 'id' | 'created_at'>) => {
  const insertPayload = {
    user_id: address.user_id,
    label: address.label || null,
    apartment: address.apartment || null,
    area: address.area || null,
    landmark: address.landmark || null,
    city: address.city || null,
    state: address.state || null,
    latitude: Number(address.latitude) || 0,
    longitude: Number(address.longitude) || 0,
    plus_code: address.plus_code || null,
    contact_name: address.contact_name || null,
    contact_phone: address.contact_phone || null,
  };

  const { data, error } = await (supabase.from('addresses') as any).insert(insertPayload).select().single();

  if (error) throw error;
  return data as Address;
};

export const updateAddress = async (id: string, updates: Partial<Address>) => {
  const { data, error } = await (supabase.from('addresses') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Address;
};

export const deleteAddress = async (id: string, userId: string) => {
  const { error } = await (supabase.from('addresses') as any).delete().eq('id', id).eq('user_id', userId);

  if (error) throw error;
};
