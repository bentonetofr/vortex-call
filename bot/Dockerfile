FROM node:24-bookworm-slim

RUN apt-get -o Acquire::ForceIPv4=true \
      -o Acquire::Retries=3 \
      -o Acquire::http::Timeout=20 \
      update \
    && apt-get install -y --no-install-recommends ca-certificates curl ffmpeg \
    && curl --ipv4 --retry 3 --connect-timeout 20 -fsSL \
      https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux \
      -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp \
    && ffmpeg -version >/dev/null \
    && yt-dlp --version \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY test ./test

RUN npm test \
    && npm prune --omit=dev \
    && npm cache clean --force

ENV NODE_ENV=production \
    FFMPEG_PATH=/usr/bin/ffmpeg \
    YTDLP_PATH=/usr/local/bin/yt-dlp

CMD ["node", "dist/index.js"]
