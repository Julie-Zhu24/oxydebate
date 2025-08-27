-- Change ownership of views from postgres to authenticator to fix security definer issue
-- This ensures the views run with proper user permissions instead of superuser privileges

ALTER VIEW public.global_rankings OWNER TO authenticator;
ALTER VIEW public.tournament_individual_leaderboard OWNER TO authenticator; 
ALTER VIEW public.tournament_team_leaderboard OWNER TO authenticator;