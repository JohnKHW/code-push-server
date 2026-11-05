FROM node:24-bookworm-slim AS build
WORKDIR /srv/codepush
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY script ./script
RUN npm run build && npm prune --omit=dev

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production API_PORT=3000 TMPDIR=/tmp
WORKDIR /srv/codepush
COPY --from=build --chown=node:node /srv/codepush/package*.json ./
COPY --from=build --chown=node:node /srv/codepush/node_modules ./node_modules
COPY --from=build --chown=node:node /srv/codepush/bin ./bin
USER node
EXPOSE 3000
CMD ["node", "bin/script/server.js"]
