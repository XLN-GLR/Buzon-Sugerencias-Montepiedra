import dotenv from 'dotenv';
dotenv.config();

export const Config = {
  PORT: process.env.PORT || 8080,
  HOST: process.env.HOST || '127.0.0.1',
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY
};

if (!Config.SUPABASE_URL || !Config.SUPABASE_KEY) {
  throw new Error("Faltan las credenciales de Supabase en el archivo .env");
}