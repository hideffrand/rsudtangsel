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

# ─── TEST 1: POST daftar-online - pasien baru (Ani, doctor_id=1 Anak) ───
echo -e "${YELLOW}[TEST 1] POST /api/daftar-online - Pasien baru (Ani Wijaya, dr. Vollico/Anak)${NC}"
R1=$(curl -s -X POST "$BASE_URL/api/daftar-online" \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "nik": "9876543210987654",
  "name": "Ani Wijaya",
  "birth_date": "1995-03-15",
  "address": "Jl. Melati No. 5",
  "phone_number": "08567890123",
  "doctor_id": 1,
  "schedule_date": "2026-08-20",
  "time": "09:30",
  "payment_type": "Umum"
}
EOF
)
check "POST daftar-online (Ani)" "$R1" "queue_number"

# ─── TEST 2: POST daftar-online - pasien baru (Citra, doctor_id=33 Mata) ───
echo -e "${YELLOW}[TEST 2] POST /api/daftar-online - Pasien baru (Citra Dewi, dr. Arif/Mata)${NC}"
R2=$(curl -s -X POST "$BASE_URL/api/daftar-online" \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "nik": "1111222233334444",
  "name": "Citra Dewi",
  "birth_date": "1988-07-20",
  "address": "Jl. Anggrek No. 10",
  "phone_number": "08711223344",
  "doctor_id": 33,
  "schedule_date": "2026-08-20",
  "time": "10:00",
  "payment_type": "Asuransi"
}
EOF
)
check "POST daftar-online (Citra - dr. Arif)" "$R2" "queue_number"

# ─── TEST 3: POST daftar-online - pasien lama (NIK Budi sudah ada) ───
echo -e "${YELLOW}[TEST 3] POST /api/daftar-online - NIK sudah terdaftar (Budi, kunjungan ke-2)${NC}"
R3=$(curl -s -X POST "$BASE_URL/api/daftar-online" \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "nik": "1234567890123456",
  "name": "Budi Santoso",
  "birth_date": "1990-01-01",
  "address": "Jl. Raya No. 123",
  "phone_number": "08123456789",
  "doctor_id": 1,
  "schedule_date": "2026-08-20",
  "time": "10:30",
  "payment_type": "BPJS"
}
EOF
)
check "POST daftar-online (Budi - NIK sudah ada)" "$R3" "queue_number"

# ─── TEST 4: GET antrian Klinik Anak ───
echo -e "${YELLOW}[TEST 4] GET /api/antrian?department=Anak&tanggal=2026-08-20${NC}"
R4=$(curl -s "$BASE_URL/api/antrian?department=Anak&tanggal=2026-08-20")
check "GET antrian Klinik Anak" "$R4" "success"

# ─── TEST 5: GET antrian Klinik Mata ───
echo -e "${YELLOW}[TEST 5] GET /api/antrian?department=Mata&tanggal=2026-08-20${NC}"
R5=$(curl -s "$BASE_URL/api/antrian?department=Mata&tanggal=2026-08-20")
check "GET antrian Klinik Mata" "$R5" "success"

# ─── TEST 6: Validasi - field wajib kosong ───
echo -e "${YELLOW}[TEST 6] POST /api/daftar-online - Validasi field wajib kosong${NC}"
R6=$(curl -s -X POST "$BASE_URL/api/daftar-online" \
  -H "Content-Type: application/json" \
  -d '{"nik":"1234","name":""}')
check "Validasi field wajib kosong → error" "$R6" "message"

# ─── TEST 7: Validasi - GET tanpa query department ───
echo -e "${YELLOW}[TEST 7] GET /api/antrian - Tanpa query parameter department${NC}"
R7=$(curl -s "$BASE_URL/api/antrian")
check "GET antrian tanpa department → error" "$R7" "message"

# ─── TEST 8: Method not allowed ───
echo -e "${YELLOW}[TEST 8] DELETE /api/daftar-online - Method not allowed${NC}"
R8=$(curl -s -X DELETE "$BASE_URL/api/daftar-online")
check "Method not allowed → error" "$R8" "message"

# ─── TEST 9: GET semua dokter ───
echo -e "${YELLOW}[TEST 9] GET /api/doctors${NC}"
R9=$(curl -s "$BASE_URL/api/doctors")
check "GET semua dokter" "$R9" "specialty"

# ─── TEST 10: GET satu dokter ───
echo -e "${YELLOW}[TEST 10] GET /api/doctors/1${NC}"
R10=$(curl -s "$BASE_URL/api/doctors/1")
check "GET satu dokter" "$R10" "specialty"

# ─── TEST 11: GET dokter tidak ada → 404 ───
echo -e "${YELLOW}[TEST 11] GET /api/doctors/999 - Dokter tidak ada${NC}"
R11=$(curl -s "$BASE_URL/api/doctors/999")
check "GET dokter tidak ada → error" "$R11" "message"

# ─── TEST 11b: POST buat dokter ───
echo -e "${YELLOW}[TEST 11b] POST /api/doctors - Buat dokter baru${NC}"
R11b=$(curl -s -X POST "$BASE_URL/api/doctors" \
  -H "Content-Type: application/json" \
  -d '{"name":"dr. Dokter Tes","specialty":"Umum","email":"tes@rsutangsel.id","phone_number":"081234567899","status":"active"}')
check "POST buat dokter" "$R11b" "specialty"
DID=$(echo "$R11b" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)

# ─── TEST 11c: PUT update dokter ───
echo -e "${YELLOW}[TEST 11c] PUT /api/doctors/$DID - Update dokter${NC}"
R11c=$(curl -s -X PUT "$BASE_URL/api/doctors/$DID" \
  -H "Content-Type: application/json" \
  -d '{"name":"dr. Dokter Tes Baru","specialty":"Kandungan","email":"tesbaru@rsutangsel.id","phone_number":"081234567899","status":"active"}')
check "PUT update dokter" "$R11c" "Kandungan"

# ─── TEST 11d: DELETE dokter ───
echo -e "${YELLOW}[TEST 11d] DELETE /api/doctors/$DID${NC}"
R11d=$(curl -s -X DELETE "$BASE_URL/api/doctors/$DID")
check "DELETE dokter" "$R11d" "success"

# ─── TEST 12: GET semua jadwal dokter ───
echo -e "${YELLOW}[TEST 12] GET /api/schedules${NC}"
R12=$(curl -s "$BASE_URL/api/schedules")
check "GET semua jadwal dokter" "$R12" "success"

# ─── TEST 13: GET jadwal per dokter ───
echo -e "${YELLOW}[TEST 13] GET /api/doctors/1/schedules${NC}"
R13=$(curl -s "$BASE_URL/api/doctors/1/schedules")
check "GET jadwal per dokter" "$R13" "success"

# ─── TEST 14: POST buat jadwal ───
echo -e "${YELLOW}[TEST 14] POST /api/schedules - Buat jadwal baru${NC}"
R14=$(curl -s -X POST "$BASE_URL/api/schedules" \
  -H "Content-Type: application/json" \
  -d '{"doctor_id":1,"day_of_week":"Saturday","start_time":"09:00","end_time":"12:00","quota":10}')
check "POST buat jadwal" "$R14" "day_of_week"
SID=$(echo "$R14" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)

# ─── TEST 15: GET satu jadwal ───
echo -e "${YELLOW}[TEST 15] GET /api/schedules/$SID${NC}"
R15=$(curl -s "$BASE_URL/api/schedules/$SID")
check "GET satu jadwal" "$R15" "start_time"

# ─── TEST 16: PUT update jadwal ───
echo -e "${YELLOW}[TEST 16] PUT /api/schedules/$SID - Update jadwal${NC}"
R16=$(curl -s -X PUT "$BASE_URL/api/schedules/$SID" \
  -H "Content-Type: application/json" \
  -d '{"doctor_id":2,"day_of_week":"Sunday","start_time":"10:00","end_time":null,"quota":25}')
check "PUT update jadwal" "$R16" "Sunday"

# ─── TEST 17: DELETE jadwal ───
echo -e "${YELLOW}[TEST 17] DELETE /api/schedules/$SID${NC}"
R17=$(curl -s -X DELETE "$BASE_URL/api/schedules/$SID")
check "DELETE jadwal" "$R17" "success"

# ─── TEST 18: GET jadwal tidak ada → 404 ───
echo -e "${YELLOW}[TEST 18] GET /api/schedules/999999 - Tidak ada${NC}"
R18=$(curl -s "$BASE_URL/api/schedules/999999")
check "GET jadwal tidak ada → error" "$R18" "message"

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
