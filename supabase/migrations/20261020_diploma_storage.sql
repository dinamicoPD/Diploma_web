-- DIPLOMA_STORAGE_V1
-- Run in Supabase SQL Editor in the SAME project as NEXT_PUBLIC_SUPABASE_URL.
-- Does not migrate/delete existing designs, fonts, images or Cloudinary objects.
-- Private bucket; each account can access only its own first-level folder.
BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('diploma-assets', 'diploma-assets', false, 20971520,
  ARRAY['image/png','image/jpeg','image/gif','image/webp','font/ttf','font/otf','font/woff','font/woff2'])
ON CONFLICT (id) DO NOTHING;

-- Refuse to silently repurpose a public or differently configured bucket.
DO $check$
DECLARE b storage.buckets%ROWTYPE;
BEGIN
  SELECT * INTO b FROM storage.buckets WHERE id = 'diploma-assets';
  IF b.public OR b.file_size_limit IS DISTINCT FROM 20971520 OR
     NOT (COALESCE(b.allowed_mime_types, ARRAY[]::text[]) @>
       ARRAY['image/png','image/jpeg','image/gif','image/webp','font/ttf','font/otf','font/woff','font/woff2']) THEN
    RAISE EXCEPTION 'diploma-assets ya existe con otra configuracion. No se cambio nada. Revisa privacidad, limite 20 MiB y tipos MIME antes de continuar.';
  END IF;
END;
$check$;

CREATE TABLE IF NOT EXISTS public.diploma_storage_assets (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  bucket_id text NOT NULL DEFAULT 'diploma-assets' CHECK (bucket_id = 'diploma-assets'),
  object_path text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('image','font')),
  file_name text NOT NULL CHECK (length(file_name) BETWEEN 1 AND 200),
  mime_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size > 0 AND byte_size <= 20971520),
  family text,
  font_format text CHECK (font_format IN ('woff','woff2','truetype','opentype')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT diploma_asset_path_owner CHECK (split_part(object_path, '/', 1) = user_id::text),
  CONSTRAINT diploma_asset_font_info CHECK (
    (kind = 'image' AND family IS NULL AND font_format IS NULL) OR
    (kind = 'font' AND family IS NOT NULL AND font_format IS NOT NULL AND byte_size <= 10485760)
  )
);
CREATE INDEX IF NOT EXISTS diploma_storage_assets_user_kind_idx
  ON public.diploma_storage_assets (user_id, kind, created_at DESC);
ALTER TABLE public.diploma_storage_assets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.diploma_storage_assets FROM anon;
REVOKE ALL ON public.diploma_storage_assets FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.diploma_storage_assets TO authenticated;

DROP POLICY IF EXISTS diploma_assets_owner_guard ON public.diploma_storage_assets;
CREATE POLICY diploma_assets_owner_guard ON public.diploma_storage_assets
  AS RESTRICTIVE FOR ALL TO public
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS diploma_assets_owner_access ON public.diploma_storage_assets;
CREATE POLICY diploma_assets_owner_access ON public.diploma_storage_assets
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Restrictive guard also prevents older broad Storage policies from exposing
-- this bucket. Other buckets are unaffected (the first branch is true).
DROP POLICY IF EXISTS diploma_storage_folder_guard ON storage.objects;
CREATE POLICY diploma_storage_folder_guard ON storage.objects
  AS RESTRICTIVE FOR ALL TO public
  USING (bucket_id <> 'diploma-assets' OR
    ((SELECT auth.uid()) IS NOT NULL AND (storage.foldername(name))[1] = (SELECT auth.uid())::text))
  WITH CHECK (bucket_id <> 'diploma-assets' OR
    ((SELECT auth.uid()) IS NOT NULL AND (storage.foldername(name))[1] = (SELECT auth.uid())::text));
DROP POLICY IF EXISTS diploma_storage_insert_own ON storage.objects;
CREATE POLICY diploma_storage_insert_own ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'diploma-assets' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND (storage.foldername(name))[2] IN ('images','fonts'));
DROP POLICY IF EXISTS diploma_storage_select_own ON storage.objects;
CREATE POLICY diploma_storage_select_own ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'diploma-assets' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS diploma_storage_delete_own ON storage.objects;
CREATE POLICY diploma_storage_delete_own ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'diploma-assets' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

COMMIT;

-- Expected: one PRIVATE bucket and RLS enabled on the new metadata table.
SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = 'diploma-assets';
SELECT relname, relrowsecurity FROM pg_class WHERE oid = 'public.diploma_storage_assets'::regclass;
