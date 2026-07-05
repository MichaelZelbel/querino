UPDATE public.prompt_kits pk
SET author_id = NULL
WHERE author_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = pk.author_id);

ALTER TABLE public.prompt_kits
  ADD CONSTRAINT prompt_kits_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;