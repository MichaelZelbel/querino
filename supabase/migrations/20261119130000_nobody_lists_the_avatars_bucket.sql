-- Nobody can list the file names in the avatars bucket (issue #43, open item
-- of docs/AUDIT_2026-09-30.md).
--
-- What was wrong. "Avatars are publicly accessible" let every role SELECT
-- every row of storage.objects in the avatars bucket. Listing a bucket is
-- such a SELECT, so anyone could enumerate the file names, and a name starts
-- with its owner's user id ("<user id>/avatar.png").
--
-- What it changes. The public SELECT policy goes. The bucket stays public, and
-- a public bucket serves /storage/v1/object/public/avatars/<path> without
-- consulting any SELECT policy, so every profile picture keeps loading by its
-- exact URL (src/pages/EditProfile.tsx stores getPublicUrl()).
--
-- The owner keeps a SELECT policy on their own folder, and needs it: the
-- profile editor uploads with upsert, which is INSERT ... ON CONFLICT DO
-- UPDATE and reads the existing row, and Storage reads the row it deletes.
-- Without it a person could no longer replace or delete their own picture.
-- The insert, update and delete policies of 20260129153203 are unchanged.

DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;

CREATE POLICY "Users can read their own avatar"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
