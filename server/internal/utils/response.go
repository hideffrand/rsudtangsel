package utils

import (
	"encoding/json"
	"net/http"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/response"
)

// SuccessResponse menulis JSON response sukses ke ResponseWriter.
func SuccessResponse(w http.ResponseWriter, statusCode int, data interface{}, msgs ...string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	message := ""
	if len(msgs) > 0 {
		message = msgs[0]
	}

	json.NewEncoder(w).Encode(response.GlobalResponseSuccess{
		Success:    true,
		StatusCode: statusCode,
		Data:       data,
		Message:    message,
	})
}

// ErrorResponse menulis JSON response error ke ResponseWriter.
func ErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(response.GlobalResponseError{
		Success:    false,
		StatusCode: statusCode,
		Message:    message,
	})
}
