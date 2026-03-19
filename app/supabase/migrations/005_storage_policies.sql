-- Storage policies for avatars bucket
-- Allows authenticated users to upload, update, delete
-- Allows public read access (bucket is already public)

CREATE POLICY avatar_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY avatar_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY avatar_select ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY avatar_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars');

-- Storage policies for trail_photos bucket
CREATE POLICY trail_photos_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'trail_photos');

CREATE POLICY trail_photos_select ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'trail_photos');

CREATE POLICY trail_photos_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'trail_photos');

-- Storage policies for reports bucket
CREATE POLICY reports_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reports');

CREATE POLICY reports_select ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'reports');
