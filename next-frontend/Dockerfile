# Build stage
FROM node:20-alpine


ARG NEXT_PUBLIC_ENV=production
ARG NEXT_PUBLIC_APP_INSIGHTS_INSTRUMENTATION_KEY

ENV ENV=$NEXT_PUBLIC_ENV
ENV NEXT_PUBLIC_APP_INSIGHTS_INSTRUMENTATION_KEY=$NEXT_PUBLIC_APP_INSIGHTS_INSTRUMENTATION_KEY

# Install ffmpeg, fonts, and create database directory
RUN apk add --no-cache ffmpeg fontconfig font-liberation ttf-liberation font-noto font-noto-extra && \
    fc-cache -f -v && \
    mkdir -p /app/database

WORKDIR /app

COPY package*.json .
RUN npm install

# Delete existing files in libass-wasm dist directory and copy our custom files
RUN rm -rf node_modules/libass-wasm/dist/js/* && \
    mkdir -p node_modules/libass-wasm/dist/js
COPY public/js/libass/subtitles-octopus-worker-legacy.js node_modules/libass-wasm/dist/js/
COPY public/js/libass/subtitles-octopus-worker.js node_modules/libass-wasm/dist/js/
COPY public/js/libass/subtitles-octopus-worker.wasm node_modules/libass-wasm/dist/js/
COPY public/js/libass/subtitles-octopus.js node_modules/libass-wasm/dist/js/
COPY public/js/libass/COPYRIGHT node_modules/libass-wasm/dist/js/

COPY . .

RUN chown -R node:node /app/database && \
    mkdir -p /app/credentials

RUN npm run build

# Switch to non-root user
USER node

EXPOSE 3000

CMD ["npm", "run", "start"]

