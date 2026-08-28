function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name} — see .env.example`);
  return value;
}

export const config = {
  supabaseUrl: required("SUPABASE_URL"),
  supabaseAnonKey: required("SUPABASE_ANON_KEY"),
  botEmail: required("BOT_EMAIL"),
  botPassword: required("BOT_PASSWORD"),
  appUrl: (process.env.APP_URL ?? "https://vortex-call.vercel.app").replace(/\/$/, ""),
  ffmpegPath: process.env.FFMPEG_PATH ?? "ffmpeg",
  ytDlpPath: process.env.YTDLP_PATH ?? "yt-dlp",
  ytDlpCookiesPath: process.env.YTDLP_COOKIES_PATH || null,
};
