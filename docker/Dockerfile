## Dockerfile for building the Node backend for Cloud Run
# This image builds the repository and runs the Express server (backend/server.js).
# It expects the repository root to contain the package.json with required deps.

FROM node:18-bullseye-slim AS build
WORKDIR /usr/src/app

# Copy package.json & package-lock if available, then install deps
COPY package*.json ./
RUN npm ci --only=production || npm install --production

# Copy the application source
COPY . .

# Use a smaller runtime image
FROM node:18-bullseye-slim AS runtime
WORKDIR /usr/src/app

# Copy installed node_modules from build stage
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app .

# Port Cloud Run expects (we'll set this when deploying). The app listens on process.env.PORT or 3000.
EXPOSE 8080

ENV NODE_ENV=production

CMD [ "node", "backend/server.js" ]
