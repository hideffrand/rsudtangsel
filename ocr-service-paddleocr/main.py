"""
FastAPI OCR Microservice (PaddleOCR Edition) - RSU Tangsel Care
Endpoint untuk menerima upload file gambar/dokumen dan mengekstrak teks menggunakan Baidu PaddleOCR.
"""

import os
import json
import time
import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ocr_engine import extract_text_from_image_bytes, get_ocr_instance
from doc_parser import parse_document, parse_field_config

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("paddleocr_service")

app = FastAPI(
    title="RSU Tangsel Care - PaddleOCR Microservice",
    description="Microservice Optical Character Recognition (OCR) berbasis Baidu PaddleOCR untuk ekstraksi dokumen medis & registrasi pasien.",
    version="3.0.0",
)

# CORS Middleware
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
    logger.info("Memulai Microservice PaddleOCR RSU Tangsel Care...")
    try:
        get_ocr_instance()
    except Exception as e:
        logger.warning(f"PaddleOCR pre-warming warning: {e}")

@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "ok",
        "service": "rsudtangsel-ocr-paddleocr",
        "engine": "Baidu PaddleOCR (DBNet + SVTR/CRNN)",
        "version": "3.0.0",
    }

@app.post("/ocr/extract", response_model=OcrResponse, tags=["OCR"])
async def extract_ocr(
    file: UploadFile = File(..., description="File gambar formulir (JPG, PNG, WebP, JFIF, BMP)"),
    doc_type: Optional[str] = Form("generic", description="Tipe dokumen: registrasi-pasien, ktp, bpjs, rujukan, resep, atau generic"),
    field_config: Optional[str] = Form(None, description="Konfigurasi field JSON dari database/web admin"),
):
    """
    Menerima file gambar, menjalankan PaddleOCR, dan mem-parse field terstruktur.
    """
    start_time = time.time()
    
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File yang diunggah kosong."
            )
        
        logger.info(f"Memproses PaddleOCR file: '{file.filename}' ({len(image_bytes)} bytes, doc_type: '{doc_type}')")

        # 1. Ekstraksi PaddleOCR Engine
        ocr_result = extract_text_from_image_bytes(image_bytes)
        raw_text = ocr_result.get("raw_text", "")
        avg_confidence = ocr_result.get("avg_confidence", 0.0)
        blocks = ocr_result.get("blocks", [])

        # 2. Parsing field
        extracted_fields = None
        if field_config:
            try:
                extracted_fields = parse_field_config(raw_text=raw_text, field_config=field_config)
            except (ValueError, json.JSONDecodeError) as exc:
                logger.warning(f"field_config tidak valid, memakai parser bawaan: {exc}")
        if extracted_fields is None:
            extracted_fields = parse_document(raw_text=raw_text, doc_type=doc_type or "generic", blocks=blocks)

        process_time_ms = round((time.time() - start_time) * 1000, 2)
        logger.info(f"Selesai memproses PaddleOCR '{file.filename}' dalam {process_time_ms} ms (avg confidence: {avg_confidence}%)")

        return OcrResponse(
            success=True,
            doc_type=doc_type or "generic",
            process_time_ms=process_time_ms,
            avg_confidence=avg_confidence,
            raw_text=raw_text,
            extracted_fields=extracted_fields,
            blocks=blocks,
            message="Ekstraksi PaddleOCR berhasil diproses.",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saat mengekstrak PaddleOCR: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Terjadi kesalahan saat memproses PaddleOCR: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
