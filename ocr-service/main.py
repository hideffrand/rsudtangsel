"""
FastAPI Hybrid OCR Microservice (PaddleOCR + Llama3.2-Vision Fallback) - RSU Tangsel Care
Endpoint:
1. POST /ocr/patient-form: Hybrid patient intake form OCR (PaddleOCR baseline + Llama3.2-Vision selective crop fallback).
2. POST /ocr/extract: Backward-compatible endpoint for Go server / Admin web proxy.
3. GET /health: Healthcheck endpoint.
"""

import io
import os
import json
import time
import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

from ocr_engine.paddle_reader import run_paddle_ocr, get_paddle_ocr_instance
from ocr_engine.vision_fallback import crop_region, read_with_llama_vision
from extraction.field_parser import parse_patient_fields
from extraction.validators import validate_field

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("hybrid_ocr_service")

app = FastAPI(
    title="RSU Tangsel Care - Hybrid OCR Microservice",
    description="Microservice OCR berbasis PaddleOCR + Llama3.2-Vision (Ollama) Fallback untuk formulir registrasi pasien.",
    version="4.0.0",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FieldResult(BaseModel):
    value: str
    confidence: Optional[float] = None
    source: str = "paddleocr"  # "paddleocr" | "llama_vision"


class PatientFormResponse(BaseModel):
    nama_lengkap: FieldResult
    nik: FieldResult
    umur: FieldResult
    jenis_kelamin: FieldResult
    no_telp: FieldResult
    processing_time_ms: int


class ExtractedField(BaseModel):
    key: str
    value: str
    confidence: float
    is_required: bool = False


class LegacyOcrResponse(BaseModel):
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
    logger.info("Memulai Hybrid OCR Service (PaddleOCR + Llama3.2-Vision)...")
    try:
        get_paddle_ocr_instance()
    except Exception as e:
        logger.warning(f"PaddleOCR pre-warming warning: {e}")


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "ok",
        "service": "rsudtangsel-hybrid-ocr",
        "engine": "PaddleOCR PP-OCRv3 + Llama3.2-Vision (Ollama)",
        "version": "4.0.0",
    }


async def process_hybrid_pipeline(pil_image: Image.Image, doc_type: str = "generic") -> Dict[str, Any]:
    """
    Executes the unified hybrid OCR pipeline:
    1. Baseline full-image PaddleOCR pass.
    2. Field parsing and format validation.
    3. Selective crop + Llama3.2-Vision fallback for fields needing review.
    """
    start_time = time.time()

    # 1. Baseline PaddleOCR
    logger.info("--> [1/3] Menjalankan PaddleOCR baseline...")
    ocr_lines = run_paddle_ocr(pil_image)
    logger.info(f"PaddleOCR mendeteksi {len(ocr_lines)} baris teks.")
    # Debug: tampilkan semua baris yang terdeteksi
    for i, ln in enumerate(ocr_lines):
        logger.info(f"  [Line {i}] conf={ln['confidence']:.2f}  text='{ln['text']}'")

    # 2. Field Extraction & Validation
    logger.info("--> [2/3] Mem-parse field & validasi format...")
    parsed_fields = parse_patient_fields(ocr_lines)

    # 3. Llama3.2-Vision Fallback for low-confidence or invalid fields
    fallback_fields = []
    for field_name, field_data in parsed_fields.items():
        if field_data["needs_review"]:
            logger.info(
                f"--> [3/3] Field '{field_name}' memerlukan bantuan Llama 3.2-Vision "
                f"(Valid: {field_data['is_valid']}, Conf: {field_data['confidence']}, Value: '{field_data['value']}')."
            )
            crop_img = crop_region(pil_image, field_data["bbox"])
            if crop_img is not None:
                vision_val = read_with_llama_vision(crop_img, field_name)
                if vision_val:
                    is_valid, cleaned_val = validate_field(field_name, vision_val)
                    field_data["value"] = cleaned_val if is_valid else vision_val
                    field_data["confidence"] = None
                    field_data["source"] = "llama_vision"
                    field_data["is_valid"] = is_valid
                    field_data["needs_review"] = not is_valid
                    fallback_fields.append(field_name)
                    logger.info(f"Hasil Llama 3.2-Vision untuk '{field_name}': '{field_data['value']}' (Valid: {is_valid})")
                else:
                    logger.warning(f"Llama 3.2-Vision tidak mengembalikan hasil untuk '{field_name}'. Mempertahankan hasil PaddleOCR.")
            else:
                logger.warning(f"Tidak dapat memotong region untuk '{field_name}'.")

    dur_ms = int(round((time.time() - start_time) * 1000))
    logger.info(f"Pipeline Hybrid selesai dalam {dur_ms} ms. Fallback VLM digunakan pada: {fallback_fields or 'Tidak ada (PaddleOCR 100%)'}")

    return {
        "ocr_lines": ocr_lines,
        "parsed_fields": parsed_fields,
        "fallback_fields": fallback_fields,
        "processing_time_ms": dur_ms,
    }


@app.post("/ocr/patient-form", response_model=PatientFormResponse, tags=["Patient Form OCR"])
async def ocr_patient_form(
    image: UploadFile = File(..., description="File foto formulir pasien (JPG, PNG, JFIF, WebP)")
):
    """
    Endpoint utama OCR formulir pasien RS (PaddleOCR + Llama3.2-Vision).
    """
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File gambar kosong atau tidak terbaca."
        )

    try:
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Format gambar tidak valid: {str(e)}"
        )

    result = await process_hybrid_pipeline(pil_image, doc_type="registrasi-pasien")
    parsed_fields = result["parsed_fields"]

    return PatientFormResponse(
        nama_lengkap=FieldResult(
            value=parsed_fields["nama_lengkap"]["value"],
            confidence=parsed_fields["nama_lengkap"]["confidence"],
            source=parsed_fields["nama_lengkap"]["source"],
        ),
        nik=FieldResult(
            value=parsed_fields["nik"]["value"],
            confidence=parsed_fields["nik"]["confidence"],
            source=parsed_fields["nik"]["source"],
        ),
        umur=FieldResult(
            value=parsed_fields["umur"]["value"],
            confidence=parsed_fields["umur"]["confidence"],
            source=parsed_fields["umur"]["source"],
        ),
        jenis_kelamin=FieldResult(
            value=parsed_fields["jenis_kelamin"]["value"],
            confidence=parsed_fields["jenis_kelamin"]["confidence"],
            source=parsed_fields["jenis_kelamin"]["source"],
        ),
        no_telp=FieldResult(
            value=parsed_fields["no_telp"]["value"],
            confidence=parsed_fields["no_telp"]["confidence"],
            source=parsed_fields["no_telp"]["source"],
        ),
        processing_time_ms=result["processing_time_ms"],
    )


@app.post("/ocr/extract", response_model=LegacyOcrResponse, tags=["Legacy Adapter"])
async def extract_ocr_legacy(
    file: UploadFile = File(..., description="File gambar formulir"),
    doc_type: Optional[str] = Form("generic"),
    field_config: Optional[str] = Form(None),
):
    """
    Endpoint adapter kompatibilitas untuk Webform Copilot dan Go Server
    yang kini SEPENUHNYA menggunakan pipeline Hybrid (PaddleOCR + Llama3.2-Vision Fallback).
    """
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File yang diunggah kosong."
        )

    try:
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Format gambar tidak valid: {str(e)}"
        )

    result = await process_hybrid_pipeline(pil_image, doc_type=doc_type or "generic")
    ocr_lines = result["ocr_lines"]
    parsed_fields = result["parsed_fields"]

    raw_text = "\n".join([line["text"] for line in ocr_lines])
    avg_confidence = round(
        sum([line["confidence"] * 100 for line in ocr_lines]) / len(ocr_lines), 2
    ) if ocr_lines else 0.0

    extracted_fields = [
        ExtractedField(
            key="Nama Lengkap",
            value=parsed_fields["nama_lengkap"]["value"],
            confidence=parsed_fields["nama_lengkap"]["confidence"] or 0.95,
            is_required=True,
        ),
        ExtractedField(
            key="NIK",
            value=parsed_fields["nik"]["value"],
            confidence=parsed_fields["nik"]["confidence"] or 0.95,
            is_required=True,
        ),
        ExtractedField(
            key="Umur",
            value=parsed_fields["umur"]["value"],
            confidence=parsed_fields["umur"]["confidence"] or 0.95,
            is_required=False,
        ),
        ExtractedField(
            key="Jenis Kelamin",
            value=parsed_fields["jenis_kelamin"]["value"],
            confidence=parsed_fields["jenis_kelamin"]["confidence"] or 0.95,
            is_required=False,
        ),
        ExtractedField(
            key="No. Telepon",
            value=parsed_fields["no_telp"]["value"],
            confidence=parsed_fields["no_telp"]["confidence"] or 0.95,
            is_required=False,
        ),
        ExtractedField(
            key="Alamat",
            value=parsed_fields.get("alamat", {}).get("value", ""),
            confidence=parsed_fields.get("alamat", {}).get("confidence") or 0.95,
            is_required=False,
        ),
    ]

    blocks = [
        {
            "text": line["text"],
            "score": round(line["confidence"] * 100, 2),
            "position": line["bbox"],
        }
        for line in ocr_lines
    ]

    return LegacyOcrResponse(
        success=True,
        doc_type=doc_type or "generic",
        process_time_ms=float(result["processing_time_ms"]),
        avg_confidence=avg_confidence,
        raw_text=raw_text,
        extracted_fields=extracted_fields,
        blocks=blocks,
        message=f"Ekstraksi Hybrid OCR selesai (VLM Fallback: {', '.join(result['fallback_fields']) if result['fallback_fields'] else 'None'}).",
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
