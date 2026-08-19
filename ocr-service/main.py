"""
FastAPI OCR Microservice — RSU Tangsel Care
Endpoint untuk menerima upload file gambar/dokumen dan mengekstrak teks menggunakan CnOCR.
"""

import os
import time
import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ocr_engine import extract_text_from_image_bytes, get_ocr_instance
from doc_parser import parse_document

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ocr_service")

app = FastAPI(
    title="RSU Tangsel Care — OCR Microservice",
    description="Microservice Optical Character Recognition (OCR) berbasis CnOCR untuk ekstraksi dokumen medis & identitas pasien.",
    version="1.0.0",
)

# CORS Middleware agar bisa dipanggil dari Go API atau langsung dari frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtractedField(BaseModel):
    key: str
    value: str
    confidence: float
    is_required: bool = False

class OcrResponse(BaseModel):
    success: bool
    doc_type: str
    process_time_ms: float
    avg_confidence: float
    raw_text: str
    extracted_fields: List[ExtractedField]
    blocks: List[Dict[str, Any]]
    message: Optional[str] = None

@app.on_event("startup")
async def startup_event():
    logger.info("Memulai OCR Microservice RSU Tangsel Care...")
    # Pre-warm OCR engine di latar belakang
    try:
        get_ocr_instance()
    except Exception as e:
        logger.warning(f"Engine pre-warming error: {e}")

@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint untuk docker healthcheck dan pemantauan gateway.
    """
    return {
        "status": "ok",
        "service": "rsudtangsel-ocr",
        "engine": "CnOCR (PyTorch)",
        "version": "1.0.0",
    }

@app.post("/ocr/extract", response_model=OcrResponse, tags=["OCR"])
async def extract_ocr(
    file: UploadFile = File(..., description="File gambar dokumen (JPG, PNG, WebP, PDF)"),
    doc_type: Optional[str] = Form("generic", description="Tipe dokumen: ktp, bpjs, rujukan, resep, atau generic"),
):
    """
    Menerima file gambar via multipart/form-data, menjalankan OCR CnOCR,
    dan mem-parse field berdasarkan doc_type.
    """
    start_time = time.time()
    
    # Validasi content type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/octet-stream", "image/bmp"]
    if file.content_type and not any(t in file.content_type.lower() for t in allowed_types) and not file.filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.bmp')):
        logger.warning(f"Menerima content_type tidak biasa: {file.content_type}, nama: {file.filename}")

    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File yang diunggah kosong."
            )
        
        logger.info(f"Memproses OCR file: '{file.filename}' (ukuran: {len(image_bytes)} bytes, tipe: '{doc_type}')")

        # 1. Ekstraksi OCR Engine
        ocr_result = extract_text_from_image_bytes(image_bytes)
        raw_text = ocr_result.get("raw_text", "")
        avg_confidence = ocr_result.get("avg_confidence", 0.0)
        blocks = ocr_result.get("blocks", [])

        # 2. Parsing field spesifik dokumen
        extracted_fields = parse_document(raw_text=raw_text, doc_type=doc_type, blocks=blocks)

        process_time_ms = round((time.time() - start_time) * 1000, 2)
        logger.info(f"Selesai memproses OCR '{file.filename}' dalam {process_time_ms} ms (avg confidence: {avg_confidence}%)")

        return OcrResponse(
            success=True,
            doc_type=doc_type or "generic",
            process_time_ms=process_time_ms,
            avg_confidence=avg_confidence,
            raw_text=raw_text,
            extracted_fields=extracted_fields,
            blocks=blocks,
            message="Ekstraksi OCR berhasil diproses.",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saat mengekstrak OCR: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Terjadi kesalahan saat memproses OCR: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
