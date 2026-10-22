# ---- 1) build the React client ----
FROM node:22-alpine AS web
WORKDIR /web
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- 2) build the Go API ----
FROM golang:1.24-alpine AS api
WORKDIR /src
COPY server-go/go.mod server-go/go.sum ./
RUN go mod download
COPY server-go/ ./
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /out/interviewiq .

# ---- 3) runtime: one small image serving API + built client ----
FROM alpine:3.20
# node + python3 are needed by the in-room code runner (JS / Python)
RUN apk add --no-cache nodejs python3 ca-certificates tzdata \
    && adduser -D -u 10001 app
WORKDIR /app
COPY --from=api /out/interviewiq ./interviewiq
COPY --from=web /web/dist ./static
USER app
ENV PORT=8000
EXPOSE 8000
CMD ["./interviewiq"]
