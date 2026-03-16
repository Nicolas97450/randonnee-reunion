export interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  premium_until: string | null;
  created_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  trail_id: string;
  completed_at: string;
  validation_type: 'gps' | 'manual';
  duration_min: number | null;
  notes: string | null;
}
