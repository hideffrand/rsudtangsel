#!/bin/bash
# test_api.sh - Full API test untuk RSU Tangsel
BASE_URL="http://localhost:8080"
PASS=0
FAIL=0

# Warna output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

check() {
    local label=$1
    local response=$2
    local expected_key=$3

    if echo "$response" | grep -q "\"$expected_key\""; then
        echo -e "${GREEN}✅ PASS${NC} $label"
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
        PASS=$((PASS+1))
    else
        echo -e "${RED}❌ FAIL${NC} $label"
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
        FAIL=$((FAIL+1))
    fi
    echo ""
}

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}   RSU Tangsel - Full API Test Suite${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""

# ─── TEST 1: POST daftar-online - pasien baru (Ani) ───
echo -e "${YELLOW}[TEST 1] POST /api/daftar-online - Pasien baru (Ani Wijaya, Poli Jantung)${NC}"
R1=$(curl -s -X POST "$BASE_URL/api/daftar-online" \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "nik": "9876543210987654",
  "nama": "Ani Wijaya",
  "tanggal_lahir": "1995-03-15",
  "alamat": "Jl. Melati No. 5",
  "no_hp": "08567890123",
  "poli": "Jantung",
  "dokter": "dr. Ahmad Sp.JP",
  "tanggal": "2026-08-20",
  "jam": "09:30",
  "jenis_pembayaran": "Umum"
}
EOF
)
check "POST daftar-online (Ani)" "$R1" "nomor_antrian"

# ─── TEST 2: POST daftar-online - pasien baru (Citra, Poli Mata) ───
echo -e "${YELLOW}[TEST 2] POST /api/daftar-online - Pasien baru (Citra Dewi, Poli Mata)${NC}"
R2=$(curl -s -X POST "$BASE_URL/api/daftar-online" \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "nik": "1111222233334444",
  "nama": "Citra Dewi",
  "tanggal_lahir": "1988-07-20",
  "alamat": "Jl. Anggrek No. 10",
  "no_hp": "08711223344",
  "poli": "Mata",
  "dokter": "dr. Siti Sp.M",
  "tanggal": "2026-08-20",
  "jam": "10:00",
  "jenis_pembayaran": "Asuransi"
}
EOF
)
check "POST daftar-online (Citra - Poli Mata)" "$R2" "nomor_antrian"

# ─── TEST 3: POST daftar-online - pasien lama (NIK Budi sudah ada) ───
echo -e "${YELLOW}[TEST 3] POST /api/daftar-online - NIK sudah terdaftar (Budi, kunjungan ke-2)${NC}"
R3=$(curl -s -X POST "$BASE_URL/api/daftar-online" \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "nik": "1234567890123456",
  "nama": "Budi Santoso",
  "tanggal_lahir": "1990-01-01",
  "alamat": "Jl. Raya No. 123",
  "no_hp": "08123456789",
  "poli": "Jantung",
  "dokter": "dr. Ahmad Sp.JP",
  "tanggal": "2026-08-20",
  "jam": "10:30",
  "jenis_pembayaran": "BPJS"
}
EOF
)
check "POST daftar-online (Budi - NIK sudah ada)" "$R3" "nomor_antrian"

# ─── TEST 4: GET antrian Poli Jantung ───
echo -e "${YELLOW}[TEST 4] GET /api/antrian?poli=Jantung&tanggal=2026-08-20${NC}"
R4=$(curl -s "$BASE_URL/api/antrian?poli=Jantung&tanggal=2026-08-20")
check "GET antrian Poli Jantung" "$R4" "success"

# ─── TEST 5: GET antrian Poli Mata ───
echo -e "${YELLOW}[TEST 5] GET /api/antrian?poli=Mata&tanggal=2026-08-20${NC}"
R5=$(curl -s "$BASE_URL/api/antrian?poli=Mata&tanggal=2026-08-20")
check "GET antrian Poli Mata" "$R5" "success"

# ─── TEST 6: Validasi - field wajib kosong ───
echo -e "${YELLOW}[TEST 6] POST /api/daftar-online - Validasi field wajib kosong${NC}"
R6=$(curl -s -X POST "$BASE_URL/api/daftar-online" \
  -H "Content-Type: application/json" \
  -d '{"nik":"1234","nama":""}')
check "Validasi field wajib kosong → error" "$R6" "error"

# ─── TEST 7: Validasi - GET tanpa query poli ───
echo -e "${YELLOW}[TEST 7] GET /api/antrian - Tanpa query parameter poli${NC}"
R7=$(curl -s "$BASE_URL/api/antrian")
check "GET antrian tanpa poli → error" "$R7" "error"

# ─── TEST 8: Method not allowed ───
echo -e "${YELLOW}[TEST 8] DELETE /api/daftar-online - Method not allowed${NC}"
R8=$(curl -s -X DELETE "$BASE_URL/api/daftar-online")
check "Method not allowed → error" "$R8" "error"

# ─── Ringkasan ───
echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}   HASIL TEST${NC}"
echo -e "${CYAN}================================================${NC}"
echo -e "${GREEN}✅ PASS: $PASS${NC}"
echo -e "${RED}❌ FAIL: $FAIL${NC}"
echo ""
if [ "$FAIL" -eq 0 ]; then
    echo -e "${GREEN}🎉 Semua test berhasil!${NC}"
else
    echo -e "${RED}⚠️  Ada $FAIL test yang gagal. Periksa log di atas.${NC}"
fi
