FROM node:24-bookworm-slim AS build
WORKDIR /srv/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /srv/app/dist /usr/share/nginx/html/admin
EXPOSE 8080
