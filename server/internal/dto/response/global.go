package response

type GlobalResponseSuccess struct {
	Success    bool   `json:"success"`
	StatusCode int    `json:"status_code"`
	Data       any    `json:"data"`
	Message    string `json:"message,omitempty"`
}

// TODO: remove GlobalResponseError and change user repo to conform to error_handler
type GlobalResponseError struct {
	Success    bool   `json:"success"`
	StatusCode int    `json:"status_code"`
	Message    string `json:"message"`
	Data       any    `json:"data"`
}
