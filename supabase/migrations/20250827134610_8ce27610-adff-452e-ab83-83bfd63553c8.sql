-- Fix SECURITY DEFINER functions by adding proper search_path settings
-- This prevents SQL injection attacks through search path manipulation

-- Update handle_new_user function with secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$function$;

-- Update has_role function with secure search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$function$;

-- Update increment_total_sessions_for_participants function with secure search_path
CREATE OR REPLACE FUNCTION public.increment_total_sessions_for_participants(participant_user_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Increment total_sessions for all participants
  UPDATE public.profiles 
  SET total_sessions = total_sessions + 1,
      updated_at = now()
  WHERE user_id = ANY(participant_user_ids);
END;
$function$;

-- Update increment_user_losses function with secure search_path
CREATE OR REPLACE FUNCTION public.increment_user_losses(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles 
  SET losses = losses + 1,
      updated_at = now()
  WHERE user_id = $1;
END;
$function$;

-- Update increment_user_wins function with secure search_path
CREATE OR REPLACE FUNCTION public.increment_user_wins(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles 
  SET wins = wins + 1,
      updated_at = now()
  WHERE user_id = $1;
END;
$function$;