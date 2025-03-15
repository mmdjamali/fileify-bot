FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

# Install ffmpeg
RUN apk update && apk add --no-cache \
    ffmpeg \
    && rm -rf /var/cache/apk/*

# Install dependencies
COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN pnpm build

CMD ["pnpm", "start"]
