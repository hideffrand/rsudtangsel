package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"time"
)

// OcrExtractedField represents a single extracted key-value field from OCR.
type OcrExtractedField struct {
	Key        string  `json:"key"`
	Value      string  `json:"value"`
	Confidence float64 `json:"confidence"`
	IsRequired bool    `json:"is_required"`
}

// OcrExtractResponse represents the parsed response from the Python OCR service.
type OcrExtractResponse struct {
	Success         bool                `json:"success"`
	DocType         string              `json:"doc_type"`
	ProcessTimeMs   float64             `json:"process_time_ms"`
	AvgConfidence   float64             `json:"avg_confidence"`
	RawText         string              `json:"raw_text"`
	ExtractedFields []OcrExtractedField `json:"extracted_fields"`
	Blocks          []any               `json:"blocks"`
	Message         string              `json:"message"`
}

// OCRService forwards OCR requests to the Python microservice.
type OCRService struct {
	ocrServiceURL string
	httpClient    *http.Client
}

// NewOCRService creates a new OCRService instance.
func NewOCRService() *OCRService {
	ocrURL := os.Getenv("OCR_SERVICE_URL")
	if ocrURL == "" {
		ocrURL = "http://localhost:8000"
	}
	return &OCRService{
		ocrServiceURL: ocrURL,
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// Extract forwards the uploaded image file and docType to the Python OCR microservice.
func (s *OCRService) Extract(fileHeader *multipart.FileHeader, docType string) (*OcrExtractResponse, error) {
	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer file.Close()

	// Prepare multipart request body
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	part, err := writer.CreateFormFile("file", fileHeader.Filename)
	if err != nil {
		return nil, fmt.Errorf("failed to create form file: %w", err)
	}

	if _, err := io.Copy(part, file); err != nil {
		return nil, fmt.Errorf("failed to copy file bytes: %w", err)
	}

	if docType != "" {
		if err := writer.WriteField("doc_type", docType); err != nil {
			return nil, fmt.Errorf("failed to write doc_type field: %w", err)
		}
	}

	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("failed to close multipart writer: %w", err)
	}

	targetURL := fmt.Sprintf("%s/ocr/extract", s.ocrServiceURL)
	req, err := http.NewRequest(http.MethodPost, targetURL, &body)
	if err != nil {
		return nil, fmt.Errorf("failed to create http request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to OCR service at %s: %w", s.ocrServiceURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OCR service returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var result OcrExtractResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode OCR response: %w", err)
	}

	return &result, nil
}
