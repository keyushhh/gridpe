import { supabase } from './src/lib/supabase'; const { data, error } = await supabase.from('orders').select('*').limit(1); console.log(data);
