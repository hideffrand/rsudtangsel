package utils

import (
	"encoding/json"
	"net/http"
)

type apiResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// SuccessResponse menulis JSON response sukses ke ResponseWriter.
func SuccessResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(apiResponse{Success: true, Data: data})
}

// ErrorResponse menulis JSON response error ke ResponseWriter.
func ErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(apiResponse{Success: false, Error: message})
}
