package repository

import (
	"database/sql"
	"fmt"

	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

// MedicalPackageRepository manages database operations for medical_packages
// (katalog gabungan MCU, Lab, dan Radiologi).
type MedicalPackageRepository struct {
	db *sqlx.DB
}

// NewMedicalPackageRepository creates a new MedicalPackageRepository.
func NewMedicalPackageRepository(db *sqlx.DB) *MedicalPackageRepository {
	return &MedicalPackageRepository{db: db}
}

// Create inserts a package with its items in a transaction and returns the ID.
func (r *MedicalPackageRepository) Create(p *model.MedicalPackage) (int, error) {
	tx, err := r.db.Beginx()
	if err != nil {
		return 0, fmt.Errorf("begin create medical package: %w", err)
	}
	defer tx.Rollback()

	var id int
	err = tx.QueryRow(
		`INSERT INTO medical_packages (type, name, description, price, is_active)
		 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		p.Type, p.Name, p.Description, p.Price, p.IsActive,
	).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("create medical package: %w", err)
	}
	if err := insertMedicalItems(tx, id, p.Items); err != nil {
		return 0, err
	}
	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("commit create medical package: %w", err)
	}
	return id, nil
}

// FindAll returns all packages of the given type ("mcu"/"lab"/"radiologi"),
// or every package when packageType is empty. Items are included.
func (r *MedicalPackageRepository) FindAll(packageType string) ([]model.MedicalPackage, error) {
	query := `SELECT id, type, name, description, price, is_active, created_at, updated_at
		FROM medical_packages`
	var args []interface{}
	if packageType != "" {
		query += ` WHERE type = $1`
		args = append(args, packageType)
	}
	query += ` ORDER BY id`

	var list []model.MedicalPackage
	err := r.db.Select(&list, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list medical packages: %w", err)
	}

	ids := make([]int, len(list))
	for i, p := range list {
		ids[i] = p.ID
	}
	if len(ids) > 0 {
		items, err := r.findItemsByPackageIDs(ids)
		if err != nil {
			return nil, err
		}
		byPackage := make(map[int][]model.MedicalPackageItem)
		for _, it := range items {
			byPackage[it.PackageID] = append(byPackage[it.PackageID], it)
		}
		for i := range list {
			list[i].Items = byPackage[list[i].ID]
		}
	}
	return list, nil
}

// FindByID returns a package with its items. Returns nil if not found.
func (r *MedicalPackageRepository) FindByID(id int) (*model.MedicalPackage, error) {
	var p model.MedicalPackage
	err := r.db.Get(&p,
		`SELECT id, type, name, description, price, is_active, created_at, updated_at
		 FROM medical_packages WHERE id = $1`, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("find medical package: %w", err)
	}

	items, err := r.findItemsByPackageIDs([]int{id})
	if err != nil {
		return nil, err
	}
	p.Items = items
	return &p, nil
}

// Update updates a package and replaces its items in a transaction.
// Returns false if the id does not exist.
func (r *MedicalPackageRepository) Update(p *model.MedicalPackage) (bool, error) {
	tx, err := r.db.Beginx()
	if err != nil {
		return false, fmt.Errorf("begin update medical package: %w", err)
	}
	defer tx.Rollback()

	res, err := tx.Exec(
		`UPDATE medical_packages SET type = $1, name = $2, description = $3, price = $4, is_active = $5, updated_at = NOW()
		 WHERE id = $6`,
		p.Type, p.Name, p.Description, p.Price, p.IsActive, p.ID,
	)
	if err != nil {
		return false, fmt.Errorf("update medical package: %w", err)
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return false, nil
	}

	if _, err := tx.Exec(`DELETE FROM medical_package_items WHERE package_id = $1`, p.ID); err != nil {
		return false, fmt.Errorf("delete old medical package items: %w", err)
	}
	if len(p.Items) > 0 {
		if err := insertMedicalItems(tx, p.ID, p.Items); err != nil {
			return false, err
		}
	}

	if err := tx.Commit(); err != nil {
		return false, fmt.Errorf("commit update medical package: %w", err)
	}
	return true, nil
}

// Delete removes a package (items cascade). Returns false if the id does not exist.
func (r *MedicalPackageRepository) Delete(id int) (bool, error) {
	res, err := r.db.Exec(`DELETE FROM medical_packages WHERE id = $1`, id)
	if err != nil {
		return false, fmt.Errorf("delete medical package: %w", err)
	}
	rows, _ := res.RowsAffected()
	return rows > 0, nil
}

// findItemsByPackageIDs fetches all items belonging to the given packages.
func (r *MedicalPackageRepository) findItemsByPackageIDs(ids []int) ([]model.MedicalPackageItem, error) {
	var items []model.MedicalPackageItem
	err := r.db.Select(&items,
		`SELECT id, package_id, name, description, position
		 FROM medical_package_items
		 WHERE package_id = ANY($1)
		 ORDER BY package_id, position, id`, pq.Array(ids))
	if err != nil {
		return nil, fmt.Errorf("list medical package items: %w", err)
	}
	return items, nil
}

// insertMedicalItems inserts the package items in order.
func insertMedicalItems(tx *sqlx.Tx, packageID int, items []model.MedicalPackageItem) error {
	for i, it := range items {
		if _, err := tx.Exec(
			`INSERT INTO medical_package_items (package_id, name, description, position)
			 VALUES ($1, $2, $3, $4)`,
			packageID, it.Name, it.Description, i,
		); err != nil {
			return fmt.Errorf("insert medical package item: %w", err)
		}
	}
	return nil
}
