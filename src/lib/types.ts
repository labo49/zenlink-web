export interface Link {
  id: string;
  user_id: string;
  url: string;
  title: string | null;
  favicon: string | null;
  description: string | null;
  notes: string | null;
  tags: string[];
  snoozed_until: string | null;
  on_next_session: boolean;
  created_at: string;
}

export type NewLink = Omit<Link, 'id' | 'created_at'>;
