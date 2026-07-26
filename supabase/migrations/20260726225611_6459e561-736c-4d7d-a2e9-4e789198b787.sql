REVOKE ALL ON FUNCTION public.provision_ai_allowance(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_ai_allowance(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.handle_new_user_allowance() FROM PUBLIC, anon, authenticated;