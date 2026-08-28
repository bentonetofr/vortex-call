import { spawn } from "child_process";
import { config } from "./config.js";

interface Dependency {
  command: string;
  label: string;
  hint: string;
}

function checkExecutable({ command, label, hint }: Dependency): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, ["--version"], { stdio: "ignore" });
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${label} demorou demais para responder. ${hint}`));
    }, 10_000);

    child.once("error", () => {
      clearTimeout(timer);
      reject(new Error(`${label} nao foi encontrado em ${JSON.stringify(command)}. ${hint}`));
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`${label} respondeu com codigo ${code ?? "desconhecido"}. ${hint}`));
    });
  });
}

export async function verifyRuntimeDependencies(): Promise<void> {
  await Promise.all([
    checkExecutable({
      command: config.ffmpegPath,
      label: "FFmpeg",
      hint: "Instale o FFmpeg ou ajuste FFMPEG_PATH no .env.",
    }),
    checkExecutable({
      command: config.ytDlpPath,
      label: "yt-dlp",
      hint: "Instale o yt-dlp ou ajuste YTDLP_PATH no .env.",
    }),
  ]);
}
