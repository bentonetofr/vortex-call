# DJ Vortex — bot de música do vortex-call

Um processo Node.js separado do app Next.js — precisa ficar rodando o
tempo todo em algum lugar (não dá pra hospedar isso na Vercel, que só roda
funções sob demanda). Entra na sala de voz como um participante próprio,
falando exatamente o mesmo protocolo de sinalização que o navegador usa
(`src/lib/useVoiceCall.ts`), então pro resto do app ele é só mais uma
pessoa na call.

**Não toca YouTube nem Spotify** — só links diretos de áudio (mp3, stream,
arquivo `.ogg`/`.wav`, rádio online, etc). Isso é proposital, não uma
limitação técnica que dê pra contornar depois:

- **YouTube**: raspar áudio de lá (via `yt-dlp` e afins) viola os termos de
  uso do YouTube — não é sobre escala (6 amigos vs. milhões), é não
  construir uma ferramenta cuja função é contornar os termos de um
  serviço.
- **Spotify**: isso nem é possível de verdade. O Spotify não expõe áudio
  bruto pra ninguém — a única integração oficial (Web Playback SDK) só
  controla remotamente um player que já tem sessão Premium logada, não dá
  pra "pegar" o áudio pra tocar em outro lugar.

Pra tocar suas próprias músicas, suba os arquivos em algum lugar com link
direto — o bucket `avatars` do Supabase Storage (já usado pelas fotos de
perfil) serve, ou qualquer outro host de arquivo.

## Comandos (digitados em qualquer canal de texto)

- `m!play <url>` — toca um link direto de áudio na sua sala de voz atual
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

## 2. Rode localmente pra testar

```bash
cd bot
npm install
cp .env.example .env
# edite .env com a URL/anon key do Supabase e o e-mail/senha do bot
npm run dev
```

Precisa do [ffmpeg](https://ffmpeg.org/) instalado e no PATH. No Windows,
`winget install ffmpeg`; no Mac, `brew install ffmpeg`.

## 3. Hospede de graça, 24h no ar

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
