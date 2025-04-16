-- Agregar campo de posición a la tabla de fotos
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS position TEXT;

-- Actualizar el orden de las columnas y los comentarios
COMMENT ON COLUMN public.photos.position IS 'Coordenadas de la posición donde se tomó la foto';

-- Actualización de permisos RLS si es necesario
-- (asumiendo que ya existen políticas de seguridad RLS para la tabla de fotos)

-- Crear índice para búsquedas basadas en posición si es necesario
-- CREATE INDEX IF NOT EXISTS idx_photos_position ON photos(position); 