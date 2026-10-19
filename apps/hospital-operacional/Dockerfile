FROM node:22.16.0-bookworm-slim
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY public ./public
COPY scripts ./scripts
RUN mkdir -p /app/data && chown -R node:node /app
USER node
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSPITAL_DATABASE_FILE=/app/data/hospital.sqlite
EXPOSE 3000
CMD ["node","src/server.mjs"]
