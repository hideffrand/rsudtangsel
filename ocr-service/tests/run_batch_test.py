"""
Batch Test Harness - Phase 6
Runs sample patient form images through the hybrid OCR pipeline,
tabulates extracted fields, checks against expected values, and logs VLM fallback rates.

Usage:
    python tests/run_batch_test.py [--dir path/to/sample_images]
"""

import os
import sys
import time
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Add parent directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ocr_engine.paddle_reader import run_paddle_ocr
from extraction.field_parser import parse_patient_fields
from ocr_engine.vision_fallback import crop_region, read_with_llama_vision
from extraction.validators import validate_field


def create_mock_sample_image(output_path: str, name: str, nik: str, umur: str, jk: str, telp: str):
    """Generates a synthetic patient form image for automated testing."""
    img = Image.new("RGB", (800, 600), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Draw header
    draw.text((50, 40), "FORMULIR PENDAFTARAN PASIEN - RSU TANGSEL CARE", fill=(14, 125, 128))
    draw.line((50, 70, 750, 70), fill=(200, 200, 200), width=2)

    # Draw fields
    y = 110
    fields = [
        ("Nama Lengkap :", name),
        ("NIK :", nik),
        ("Umur :", f"{umur} tahun"),
        ("Jenis Kelamin :", jk),
        ("No. Telp :", telp),
    ]

    for label, val in fields:
        draw.text((60, y), label, fill=(50, 50, 50))
        draw.text((250, y), val, fill=(20, 20, 20))
        draw.line((240, y + 25, 700, y + 25), fill=(220, 220, 220), width=1)
        y += 60

    img.save(output_path)
    return output_path


def run_single_image_pipeline(image_path: str) -> dict:
    """Executes the full hybrid pipeline on a single image file."""
    start_t = time.time()
    pil_image = Image.open(image_path).convert("RGB")

    # 1. PaddleOCR Pass
    lines = run_paddle_ocr(pil_image)

    # 2. Field Extraction & Validation
    parsed = parse_patient_fields(lines)

    # 3. Vision Fallback
    fallback_count = 0
    for field_name, field_data in parsed.items():
        if field_data["needs_review"]:
            crop_img = crop_region(pil_image, field_data["bbox"])
            if crop_img is not None:
                vision_val = read_with_llama_vision(crop_img, field_name)
                if vision_val:
                    is_valid, cleaned = validate_field(field_name, vision_val)
                    field_data["value"] = cleaned if is_valid else vision_val
                    field_data["confidence"] = None
                    field_data["source"] = "llama_vision"
                    field_data["is_valid"] = is_valid
                    fallback_count += 1

    dur_ms = int((time.time() - start_t) * 1000)
    return {
        "fields": parsed,
        "duration_ms": dur_ms,
        "fallback_count": fallback_count,
    }


def main():
    parser = argparse.ArgumentParser(description="Hybrid OCR Batch Tester")
    parser.add_argument("--dir", default=None, help="Directory containing test form images")
    args = parser.parse_args()

    test_images = []
    if args.dir and os.path.isdir(args.dir):
        test_images = [
            os.path.join(args.dir, f) for f in os.listdir(args.dir)
            if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".jfif"))
        ]
    else:
        # Generate synthetic test samples in scratch directory
        test_dir = Path(__file__).parent / "sample_data"
        test_dir.mkdir(parents=True, exist_ok=True)

        samples = [
            ("sample1.png", "Ahmad Fauzi", "3674012304950001", "30", "Laki-laki", "081234567890"),
            ("sample2.png", "Siti Rahma", "3674026511900002", "34", "Perempuan", "085712345678"),
            ("sample3.png", "Budi Pratama", "3674031508850003", "40", "Laki-laki", "081987654321"),
        ]

        for fname, name, nik, umur, jk, telp in samples:
            out_file = str(test_dir / fname)
            create_mock_sample_image(out_file, name, nik, umur, jk, telp)
            test_images.append(out_file)

    print("\n" + "=" * 80)
    print("[RUN] MEMULAI BATCH TEST HYBRID OCR (PaddleOCR + Llama3.2-Vision)")
    print("=" * 80)

    total_fields = 0
    total_fallbacks = 0
    total_duration = 0

    for img_path in test_images:
        print(f"\n[FILE] Menguji: {os.path.basename(img_path)}")
        res = run_single_image_pipeline(img_path)
        total_duration += res["duration_ms"]
        fields = res["fields"]

        print(f"[TIME] Waktu proses: {res['duration_ms']} ms | VLM Fallbacks: {res['fallback_count']}")
        print(f"{'Field':<15} | {'Value':<30} | {'Conf':<6} | {'Source':<12} | {'Valid'}")
        print("-" * 75)

        for f_name, f_data in fields.items():
            total_fields += 1
            if f_data["source"] == "llama_vision":
                total_fallbacks += 1
            val_str = str(f_data["value"] or "-").encode("ascii", "replace").decode("ascii")
            conf_str = f"{f_data['confidence']:.2f}" if f_data['confidence'] is not None else "-"
            print(f"{f_name:<15} | {val_str:<30} | {conf_str:<6} | {f_data['source']:<12} | {f_data['is_valid']}")

    fallback_rate = (total_fallbacks / total_fields * 100) if total_fields else 0
    print("\n" + "=" * 80)
    print(f"[SUMMARY] {len(test_images)} gambar diuji | Rata-rata waktu: {total_duration / len(test_images):.1f} ms")
    print(f"[METRICS] Total Field: {total_fields} | VLM Fallback Triggered: {total_fallbacks} ({fallback_rate:.1f}%)")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
