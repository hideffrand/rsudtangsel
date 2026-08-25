package model

import "time"

// MedicalPackageType enumerates the catalog package types.
// Values: 'mcu' | 'lab' | 'radiologi'.
type MedicalPackageType string

const (
	MedicalPackageTypeMCU       MedicalPackageType = "mcu"
	MedicalPackageTypeLab       MedicalPackageType = "lab"
	MedicalPackageTypeRadiologi MedicalPackageType = "radiologi"
)

// IsValidMedicalPackageType reports whether t is a known package type.
func IsValidMedicalPackageType(t string) bool {
	switch MedicalPackageType(t) {
	case MedicalPackageTypeMCU, MedicalPackageTypeLab, MedicalPackageTypeRadiologi:
		return true
	}
	return false
}

// MedicalPackage represents the medical_packages table
// (katalog gabungan MCU, Lab, dan Radiologi).
type MedicalPackage struct {
	ID          int                  `db:"id"`
	Type        string               `db:"type"`
	Name        string               `db:"name"`
	Description string               `db:"description"`
	Price       int64                `db:"price"`
	IsActive    bool                 `db:"is_active"`
	CreatedAt   time.Time            `db:"created_at"`
	UpdatedAt   time.Time            `db:"updated_at"`
	Items       []MedicalPackageItem `db:"-"`
}

// MedicalPackageItem represents a single item in the medical_package_items table.
type MedicalPackageItem struct {
	ID          int    `db:"id"`
	PackageID   int    `db:"package_id"`
	Name        string `db:"name"`
	Description string `db:"description"`
	Position    int    `db:"position"`
}
