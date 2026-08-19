package model

import "time"

// DiagnosticService represents the diagnostic_services table
// (catalog layanan Lab & Radiologi).
type DiagnosticService struct {
	ID          int                     `db:"id"`
	Category    string                  `db:"category"` // 'lab' | 'radiologi'
	Name        string                  `db:"name"`
	Description string                  `db:"description"`
	Price       int64                   `db:"price"`
	IsActive    bool                    `db:"is_active"`
	CreatedAt   time.Time               `db:"created_at"`
	UpdatedAt   time.Time               `db:"updated_at"`
	Items       []DiagnosticServiceItem `db:"-"`
}

// DiagnosticServiceItem represents a single item in the diagnostic_service_items table.
type DiagnosticServiceItem struct {
	ID          int    `db:"id"`
	ServiceID   int    `db:"service_id"`
	Name        string `db:"name"`
	Description string `db:"description"`
	Position    int    `db:"position"`
}
