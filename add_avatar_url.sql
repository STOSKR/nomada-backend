-- Agregar columna avatar_url a la tabla users si no existe
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS avatar_url TEXT; 