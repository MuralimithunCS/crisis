FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Install all dependencies including devDependencies (typescript)
RUN npm install
COPY . .
# Run tsc build
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeuser
# Only copy production dependencies
COPY --from=builder /app/package.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
USER nodeuser
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
