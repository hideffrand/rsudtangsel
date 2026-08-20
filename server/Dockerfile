# =========================================================
# Builder: binary API + migrate CLI (driver postgres, pinned v4.17.1)
# =========================================================
FROM golang:1.25-alpine AS builder
WORKDIR /src

# Cache layer dependency
COPY go.mod go.sum ./
RUN go mod download

# Bangun binary API (docs HTML sudah ter-embed via go:embed)
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/api

# migrate CLI dengan driver postgres (sama dengan `make install-migrate`)
RUN go install -tags postgres github.com/golang-migrate/migrate/v4/cmd/migrate@v4.17.1

# =========================================================
# Runtime: alpine minimal + CA certs (QR api.qrserver.com) + tzdata
# =========================================================
FROM alpine:3.20 AS runner
RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -S app && adduser -S app -G app

WORKDIR /app
COPY --from=builder /out/server /usr/local/bin/server
COPY --from=builder /go/bin/migrate /usr/local/bin/migrate
COPY --from=builder /src/migrations ./migrations
COPY --chown=app:app entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

USER app
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
