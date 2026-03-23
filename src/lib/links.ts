import { supabase } from './supabase';
import type { Link, NewLink } from './types';

export async function fetchAllLinks(userId: string): Promise<Link[]> {
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function deleteLink(id: string): Promise<void> {
  const { error } = await supabase.from('links').delete().eq('id', id);
  if (error) throw error;
}

export async function importLinks(links: NewLink[]): Promise<number> {
  const { data, error } = await supabase.from('links').insert(links).select('id');
  if (error) throw error;
  return data.length;
}
