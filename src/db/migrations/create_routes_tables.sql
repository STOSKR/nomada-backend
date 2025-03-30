-- Tabla de rutas de viaje
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  country TEXT,
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  cover_image TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de lugares/puntos de interés
CREATE TABLE IF NOT EXISTS public.places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  coordinates POINT,
  address TEXT,
  order_index INTEGER NOT NULL,
  visit_date DATE,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de fotos
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de likes
CREATE TABLE IF NOT EXISTS public.route_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(route_id, user_id)
);

-- Función que incrementa contador de likes al crear like
CREATE OR REPLACE FUNCTION handle_new_route_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrementar contador de likes de la ruta
  UPDATE routes
  SET likes_count = likes_count + 1
  WHERE id = NEW.route_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función que decrementa contador de likes al eliminar like
CREATE OR REPLACE FUNCTION handle_remove_route_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrementar contador de likes
  UPDATE routes
  SET likes_count = likes_count - 1
  WHERE id = OLD.route_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para nuevos likes
DROP TRIGGER IF EXISTS on_route_like_created ON route_likes;
CREATE TRIGGER on_route_like_created
  AFTER INSERT ON route_likes
  FOR EACH ROW EXECUTE PROCEDURE handle_new_route_like();

-- Trigger para eliminación de likes
DROP TRIGGER IF EXISTS on_route_like_deleted ON route_likes;
CREATE TRIGGER on_route_like_deleted
  AFTER DELETE ON route_likes
  FOR EACH ROW EXECUTE PROCEDURE handle_remove_route_like();

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_routes_user_id ON routes(user_id);
CREATE INDEX IF NOT EXISTS idx_places_route_id ON places(route_id);
CREATE INDEX IF NOT EXISTS idx_photos_place_id ON photos(place_id);
CREATE INDEX IF NOT EXISTS idx_route_likes_route_id ON route_likes(route_id);
CREATE INDEX IF NOT EXISTS idx_route_likes_user_id ON route_likes(user_id); 