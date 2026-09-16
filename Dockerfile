FROM node:18-alpine AS build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
COPY server/ ./server/
COPY --from=build-frontend /app/frontend/dist ./frontend/dist

RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt-lists/*
RUN cd frontend/dist && npm install -g serve

EXPOSE 8085 5173

CMD ["sh", "-c", "python3 server/server.py & serve -s frontend/dist -l 5173"]
