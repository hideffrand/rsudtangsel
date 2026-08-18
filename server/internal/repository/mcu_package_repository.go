package repository

import (
	"database/sql"
	"fmt"

	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

// McuPackageRepository manages database operations for mcu_packages.
type McuPackageRepository struct {
	db *sqlx.DB
}

// NewMcuPackageRepository creates a new McuPackageRepository.
func NewMcuPackageRepository(db *sqlx.DB) *McuPackageRepository {
	return &McuPackageRepository{db: db}
}

// Create inserts a package with its items in a transaction and returns the ID.
func (r *McuPackageRepository) Create(p *model.McuPackage) (int, error) {
	tx, err := r.db.Beginx()
	if err != nil {
		return 0, fmt.Errorf("begin create mcu package: %w", err)
	}
	defer tx.Rollback()

	var id int
	err = tx.QueryRow(
		`INSERT INTO mcu_packages (name, description, price, is_active)
		 VALUES ($1, $2, $3, $4) RETURNING id`,
		p.Name, p.Description, p.Price, p.IsActive,
	).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("create mcu package: %w", err)
	}
	if err := insertMcuItems(tx, id, p.Items); err != nil {
		return 0, err
	}
	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("commit create mcu package: %w", err)
	}
	return id, nil
}

// FindAll returns all packages with their items.
func (r *McuPackageRepository) FindAll() ([]model.McuPackage, error) {
	var list []model.McuPackage
	err := r.db.Select(&list,
		`SELECT id, name, description, price, is_active, created_at, updated_at
		 FROM mcu_packages ORDER BY id`)
	if err != nil {
		return nil, fmt.Errorf("list mcu packages: %w", err)
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
		byPackage := make(map[int][]model.McuPackageItem)
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
func (r *McuPackageRepository) FindByID(id int) (*model.McuPackage, error) {
	var p model.McuPackage
	err := r.db.Get(&p,
		`SELECT id, name, description, price, is_active, created_at, updated_at
		 FROM mcu_packages WHERE id = $1`, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("find mcu package: %w", err)
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
func (r *McuPackageRepository) Update(p *model.McuPackage) (bool, error) {
	tx, err := r.db.Beginx()
	if err != nil {
		return false, fmt.Errorf("begin update mcu package: %w", err)
	}
	defer tx.Rollback()

	res, err := tx.Exec(
		`UPDATE mcu_packages SET name = $1, description = $2, price = $3, is_active = $4
		 WHERE id = $5`,
		p.Name, p.Description, p.Price, p.IsActive, p.ID,
	)
	if err != nil {
		return false, fmt.Errorf("update mcu package: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return false, nil
	}

	if _, err := tx.Exec(`DELETE FROM mcu_package_items WHERE package_id = $1`, p.ID); err != nil {
		return false, fmt.Errorf("delete mcu package items: %w", err)
	}
	if err := insertMcuItems(tx, p.ID, p.Items); err != nil {
		return false, err
	}
	if err := tx.Commit(); err != nil {
		return false, fmt.Errorf("commit update mcu package: %w", err)
	}
	return true, nil
}

// Delete removes a package. Returns false if the id does not exist.
func (r *McuPackageRepository) Delete(id int) (bool, error) {
	res, err := r.db.Exec(`DELETE FROM mcu_packages WHERE id = $1`, id)
	if err != nil {
		return false, fmt.Errorf("delete mcu package: %w", err)
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

func (r *McuPackageRepository) findItemsByPackageIDs(ids []int) ([]model.McuPackageItem, error) {
	var items []model.McuPackageItem
	query := `SELECT id, package_id, name, description, position
	           FROM mcu_package_items WHERE package_id = ANY($1)
	           ORDER BY package_id, position, id`
	err := r.db.Select(&items, query, pq.Array(ids))
	if err != nil {
		return nil, fmt.Errorf("list mcu package items: %w", err)
	}
	return items, nil
}

func insertMcuItems(tx *sqlx.Tx, packageID int, items []model.McuPackageItem) error {
	for i, item := range items {
		_, err := tx.Exec(
			`INSERT INTO mcu_package_items (package_id, name, description, position)
			 VALUES ($1, $2, $3, $4)`,
			packageID, item.Name, item.Description, i,
		)
		if err != nil {
			return fmt.Errorf("create mcu package item: %w", err)
		}
	}
	return nil
}
