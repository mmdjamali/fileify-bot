FROM node:22-alpine AS build

RUN npm install -g pnpm@11.5.0

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN pnpm build && pnpm prune --prod

FROM node:22-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY package.json ./
COPY locales ./locales

RUN mkdir -p downloads processed && chown node:node downloads processed

USER node

CMD ["node", "build/bot.js"]
