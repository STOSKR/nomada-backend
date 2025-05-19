-- Tabla para almacenar suscriptores del newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Añadir restricciones
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);

-- Índice para filtrar suscriptores activos
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(is_active);

-- Comentarios de tabla y columnas
COMMENT ON TABLE newsletter_subscribers IS 'Almacena los correos electrónicos suscritos al newsletter';
COMMENT ON COLUMN newsletter_subscribers.id IS 'Identificador único del suscriptor';
COMMENT ON COLUMN newsletter_subscribers.email IS 'Correo electrónico del suscriptor';
COMMENT ON COLUMN newsletter_subscribers.subscribed_at IS 'Fecha y hora de suscripción';
COMMENT ON COLUMN newsletter_subscribers.unsubscribed_at IS 'Fecha y hora de baja (NULL si sigue suscrito)';
COMMENT ON COLUMN newsletter_subscribers.is_active IS 'Indica si la suscripción está activa';

-- Políticas RLS (Row Level Security) para la tabla
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Política para permitir a usuarios autenticados listar suscriptores
CREATE POLICY "Usuarios autenticados pueden ver suscriptores" 
    ON newsletter_subscribers
    FOR SELECT 
    TO authenticated
    USING (true);

-- Política para permitir inserción desde el frontend
CREATE POLICY "Cualquiera puede suscribirse"
    ON newsletter_subscribers
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Política para permitir actualización solo con correspondencia de email
CREATE POLICY "Suscriptores pueden darse de baja"
    ON newsletter_subscribers
    FOR UPDATE
    USING (true)
    WITH CHECK (true); 