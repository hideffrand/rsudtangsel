#!/bin/sh
set -e

# Tunggu database siap lalu jalankan migrasi (idempotent) sebelum start.
# Dipakai agar `docker compose up` langsung menghasilkan DB yang termigrasi.
i=0
until migrate -path /app/migrations -database "$DATABASE_URL" up; do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    echo "Migrasi gagal setelah 60 percobaan — keluar." >&2
    exit 1
  fi
  echo "Database belum siap / migrasi gagal (percobaan $i), coba lagi dalam 2 detik..." >&2
  sleep 2
done

echo "Migrasi selesai. Menjalankan API server..."
exec /usr/local/bin/server
