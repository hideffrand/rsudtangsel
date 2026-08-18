package model

import "time"

// McuPackage represents the mcu_packages table.
type McuPackage struct {
	ID          int              `db:"id"`
	Name        string           `db:"name"`
	Description string           `db:"description"`
	Price       int64            `db:"price"`
	IsActive    bool             `db:"is_active"`
	CreatedAt   time.Time        `db:"created_at"`
	UpdatedAt   time.Time        `db:"updated_at"`
	Items       []McuPackageItem `db:"-"`
}

// McuPackageItem represents a single item in the mcu_package_items table.
type McuPackageItem struct {
	ID          int    `db:"id"`
	PackageID   int    `db:"package_id"`
	Name        string `db:"name"`
	Description string `db:"description"`
	Position    int    `db:"position"`
}
