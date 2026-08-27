-- Migración: Crear tabla de comentarios para sugerencias
-- Tabla: public.comentarios_sugerencias

CREATE TABLE IF NOT EXISTS public.comentarios_sugerencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sugerencia_id UUID NOT NULL REFERENCES public.sugerencias(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.comentarios_sugerencias ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad RLS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comentarios_sugerencias' AND policyname = 'Permitir lectura publica de comentarios'
    ) THEN
        CREATE POLICY "Permitir lectura publica de comentarios" 
        ON public.comentarios_sugerencias 
        FOR SELECT 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comentarios_sugerencias' AND policyname = 'Permitir insercion de comentarios'
    ) THEN
        CREATE POLICY "Permitir insercion de comentarios" 
        ON public.comentarios_sugerencias 
        FOR INSERT 
        WITH CHECK (true);
    END IF;
END $$;
