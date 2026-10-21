FROM node:26-alpine AS frontend-builder
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM golang:1.27-alpine AS backend-builder
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY main.go ./
COPY internal/ ./internal/
COPY migrations/ ./migrations/
COPY cmd/ ./cmd/
COPY data/ ./data/
COPY --from=frontend-builder /build/dist ./dist
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /build/dailies-server .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /build/dailies-seed ./cmd/seed

FROM alpine:3.24
WORKDIR /app
COPY --from=backend-builder /build/dailies-server /app/dailies-server
COPY --from=backend-builder /build/dailies-seed /app/dailies-seed
COPY data/ /app/data/
EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8090/api/health || exit 1

ENTRYPOINT ["/app/dailies-server", "serve", "--http=0.0.0.0:8090", "--dir=/app/pb_data"]
