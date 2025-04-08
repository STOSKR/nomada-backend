-- Agregar columna avatar_url a la tabla users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Crear bucket para avatares si no existe
INSERT INTO storage.buckets (id, name)
VALUES ('avatars', 'avatars')
ON CONFLICT (id) DO NOTHING;

-- Configurar políticas de acceso para el bucket de avatares
CREATE POLICY "Avatar files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() = (SELECT id FROM users WHERE id::text = SPLIT_PART(name, '-', 1))
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' AND
    auth.uid() = (SELECT id FROM users WHERE id::text = SPLIT_PART(name, '-', 1))
)
WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() = (SELECT id FROM users WHERE id::text = SPLIT_PART(name, '-', 1))
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' AND
    auth.uid() = (SELECT id FROM users WHERE id::text = SPLIT_PART(name, '-', 1))
); 