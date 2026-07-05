CREATE OR REPLACE FUNCTION public.store_service_role_key(p_key TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_id UUID;
  v_current TEXT;
BEGIN
  v_role := COALESCE(current_setting('request.jwt.claims', true)::jsonb->>'role', '');
  IF v_role <> 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_key IS NULL OR length(p_key) < 30 THEN
    RAISE EXCEPTION 'invalid key';
  END IF;

  SELECT id INTO v_id FROM vault.secrets WHERE name = 'service_role_key';
  IF v_id IS NULL THEN
    PERFORM vault.create_secret(p_key, 'service_role_key');
    RETURN jsonb_build_object('status', 'created', 'key_length', length(p_key));
  END IF;

  SELECT decrypted_secret INTO v_current FROM vault.decrypted_secrets WHERE id = v_id;
  IF v_current = p_key THEN
    RETURN jsonb_build_object('status', 'already_set');
  END IF;

  PERFORM vault.update_secret(v_id, p_key);
  RETURN jsonb_build_object('status', 'updated', 'key_length', length(p_key));
END;
$$;

REVOKE ALL ON FUNCTION public.store_service_role_key(TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.store_service_role_key(TEXT) TO service_role;