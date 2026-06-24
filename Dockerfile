# Portable image — runs the same on Render, Railway, Fly.io, or Alibaba ECS/ACK.
FROM node:20-alpine
WORKDIR /app

# Install deps first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# App source
COPY . .

ENV NODE_ENV=production
ENV PORT=3737
EXPOSE 3737

CMD ["npm", "start"]
