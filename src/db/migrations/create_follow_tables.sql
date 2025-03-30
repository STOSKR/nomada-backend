-- Tabla de relaciones de seguimiento
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Añadir columnas de contadores a la tabla users si no existen
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'users' 
                 AND column_name = 'followers_count') THEN
    ALTER TABLE users ADD COLUMN followers_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'users' 
                 AND column_name = 'following_count') THEN
    ALTER TABLE users ADD COLUMN following_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Función que incrementa contadores al crear seguimiento
CREATE OR REPLACE FUNCTION handle_new_follow()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrementar contador de seguidores del usuario seguido
  UPDATE users
  SET followers_count = followers_count + 1
  WHERE id = NEW.following_id;
  
  -- Incrementar contador de seguidos del usuario que sigue
  UPDATE users
  SET following_count = following_count + 1
  WHERE id = NEW.follower_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función que decrementa contadores al eliminar seguimiento
CREATE OR REPLACE FUNCTION handle_remove_follow()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrementar contador de seguidores
  UPDATE users
  SET followers_count = followers_count - 1
  WHERE id = OLD.following_id;
  
  -- Decrementar contador de seguidos
  UPDATE users
  SET following_count = following_count - 1
  WHERE id = OLD.follower_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para nuevos seguimientos
DROP TRIGGER IF EXISTS on_follow_created ON user_follows;
CREATE TRIGGER on_follow_created
  AFTER INSERT ON user_follows
  FOR EACH ROW EXECUTE PROCEDURE handle_new_follow();

-- Trigger para eliminación de seguimientos
DROP TRIGGER IF EXISTS on_follow_deleted ON user_follows;
CREATE TRIGGER on_follow_deleted
  AFTER DELETE ON user_follows
  FOR EACH ROW EXECUTE PROCEDURE handle_remove_follow(); 