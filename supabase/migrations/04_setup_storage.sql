-- Enable the pgcrypto extension for gen_random_uuid()
create extension if not exists pgcrypto;

-- Create a storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Set up storage policies for the avatars bucket
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatar images
create policy "Users can upload avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    -- Only allow image files
    and (
      lower(right(name, 4)) in ('.jpg', '.png', '.gif') 
      or lower(right(name, 5)) = '.jpeg'
    )
  );

-- Allow users to update their own avatar images
create policy "Users can update their own avatars"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and position(auth.uid()::text in name) > 0
  );

-- Allow users to delete their own avatar images
create policy "Users can delete their own avatars"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and position(auth.uid()::text in name) > 0
  );
