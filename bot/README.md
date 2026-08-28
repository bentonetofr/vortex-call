# DJ Vortex — bot de música do vortex-call

Um processo Node.js separado do app Next.js — precisa ficar rodando o
tempo todo em algum lugar (não dá pra hospedar isso na Vercel, que só roda
funções sob demanda). Entra na sala de voz como um participante próprio,
falando exatamente o mesmo protocolo de sinalização que o navegador usa
(`src/lib/useVoiceCall.ts`), então pro resto do app ele é só mais uma
pessoa na call.

Aceita vídeos públicos do YouTube (via `yt-dlp`) e links diretos de áudio
(mp3, stream, `.ogg`, `.wav`, rádio online etc.). Use apenas conteúdo que
você tem autorização para reproduzir. Spotify não é aceito porque não
fornece um fluxo de áudio bruto para esse tipo de reprodução.

Este não é um bot Discord: as salas de voz pertencem ao próprio Vortex
Call e usam Supabase Realtime + WebRTC (`werift`). Por isso não há motivo
para instalar `discord.js` ou `@discordjs/voice`; o bot já entra na sala do
usuário pelo protocolo nativo do projeto.

## Comandos (digitados em qualquer canal de texto)

- `m!play <url>` — toca um vídeo do YouTube ou link direto de áudio na sua sala de voz atual
- `m!skip` — pula a faixa
- `m!stop` — limpa a fila e sai da sala
- `m!fila` — mostra o que está tocando
- `m!ajuda` — lista os comandos

## 1. Crie a conta do bot no Supabase

Dashboard do Supabase → **Authentication → Users → Add user**. Preencha um
e-mail (ex: `bot@vortexcall.local`) e senha — marque "Auto Confirm User".
O gatilho que já existe (`handle_new_user`) cria a linha de member
automaticamente.

Depois, dê um nome e cor decentes pro bot rodando isto no SQL Editor
(troque o e-mail se usou outro):

```sql
update members
set name = 'DJ Vortex', color = '#f2c94c'
where id = (select id from auth.users where email = 'bot@vortexcall.local');
```

Dica: dá pra logar no vortex-call normalmente com esse e-mail/senha (numa
aba anônima) e usar a tela de configurações de perfil já existente pra dar
uma foto pro bot também — não precisa de ferramenta nenhuma extra pra isso.

## 2. Instale FFmpeg e yt-dlp

Os dois executáveis precisam estar no `PATH`. Se estiverem em outro lugar,
defina os caminhos completos em `FFMPEG_PATH` e `YTDLP_PATH` no `.env`.

- Windows: instale FFmpeg e `yt-dlp` pelo gerenciador de pacotes de sua
  preferência e abra um terminal novo depois da instalação.
- Ubuntu/Debian: instale `ffmpeg` pelo gerenciador do sistema e siga o
  método recomendado pelo projeto `yt-dlp` para obter uma versão atual.
- macOS: ambos estão disponíveis pelo Homebrew.

O bot verifica as duas dependências ao iniciar e encerra com uma mensagem
clara se alguma estiver ausente. Mantenha o `yt-dlp` atualizado, pois o
YouTube muda com frequência. Para vídeos que exigem sessão (idade ou
região), `YTDLP_COOKIES_PATH` pode apontar para um arquivo de cookies no
formato Netscape; não versione esse arquivo.

## 3. Rode localmente pra testar

```bash
cd bot
npm install
cp .env.example .env
# edite .env com a URL/anon key do Supabase e o e-mail/senha do bot
npm run dev
```

Antes de conectar ao Supabase, confira o código e os testes:

```bash
npm run build
npm test
```

## 4. Hospede 24h no ar

A Vercel não serve pra isso (funções são sob demanda, esse processo
precisa ficar sempre ligado). A opção realmente gratuita para sempre é uma
VM da **Oracle Cloud Free Tier**:

1. Crie conta em [cloud.oracle.com](https://cloud.oracle.com) (o tier
   "Always Free" não expira nem cobra, mas pede cartão pra verificação).
2. Crie uma instância de computação **Always Free** — Ampere A1 (ARM,
   até 4 OCPUs/24GB grátis) rodando Ubuntu.
3. Abra uma porta de saída livre no Security List (esse bot só faz
   conexões de saída — WebSocket pro Supabase, WebRTC/TURN — não precisa
   abrir porta de entrada nenhuma).
4. SSH na instância e instale as dependências:

```bash
sudo apt update && sudo apt install -y ffmpeg nodejs npm git
# instale também uma versão atual do yt-dlp conforme a documentação oficial
```

5. Copie a pasta `bot/` pra lá (via `git clone` do repo, ou `scp`) e repita
   o passo 2 (`npm install`, `.env`).

6. Deixe rodando sempre com **systemd** (já vem em qualquer VM Linux, sem
   instalar nada a mais). Crie `/etc/systemd/system/dj-vortex.service`:

```ini
[Unit]
Description=DJ Vortex - bot de musica do vortex-call
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/ubuntu/vortex-call/bot
ExecStart=/usr/bin/npx tsx src/index.ts
Restart=always
RestartSec=5
EnvironmentFile=/home/ubuntu/vortex-call/bot/.env

[Install]
WantedBy=multi-user.target
```

Depois:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now dj-vortex
journalctl -u dj-vortex -f   # ver os logs ao vivo
```

Isso mantém o bot ligado 24h e reinicia sozinho se cair.
