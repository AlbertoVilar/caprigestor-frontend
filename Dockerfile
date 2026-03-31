# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
RUN npm install --no-save @rollup/rollup-linux-x64-gnu

COPY . .

ARG VITE_API_BASE_URL
ARG VITE_ENABLE_DEPRECATED_API_FALLBACK=false

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_ENABLE_DEPRECATED_API_FALLBACK=${VITE_ENABLE_DEPRECATED_API_FALLBACK}

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
