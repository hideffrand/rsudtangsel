package repository

import (
	"database/sql"
	"fmt"

	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

// DiagnosticServiceRepository manages database operations for diagnostic_services.
type DiagnosticServiceRepository struct {
	db *sqlx.DB
}

// NewDiagnosticServiceRepository creates a new DiagnosticServiceRepository.
func NewDiagnosticServiceRepository(db *sqlx.DB) *DiagnosticServiceRepository {
	return &DiagnosticServiceRepository{db: db}
}

// Create inserts a diagnostic service with its items in a transaction and returns the ID.
func (r *DiagnosticServiceRepository) Create(s *model.DiagnosticService) (int, error) {
	tx, err := r.db.Beginx()
	if err != nil {
		return 0, fmt.Errorf("begin create diagnostic service: %w", err)
	}
	defer tx.Rollback()

	var id int
	err = tx.QueryRow(
		`INSERT INTO diagnostic_services (category, name, description, price, is_active)
		 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		s.Category, s.Name, s.Description, s.Price, s.IsActive,
	).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("create diagnostic service: %w", err)
	}
	if err := insertDiagnosticItems(tx, id, s.Items); err != nil {
		return 0, err
	}
	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("commit create diagnostic service: %w", err)
	}
	return id, nil
}

// FindAll returns all diagnostic services with their items.
// If category is non-empty, only services of that category are returned.
func (r *DiagnosticServiceRepository) FindAll(category string) ([]model.DiagnosticService, error) {
	var list []model.DiagnosticService
	query := `SELECT id, category, name, description, price, is_active, created_at, updated_at
	          FROM diagnostic_services`
	args := []interface{}{}
	if category != "" {
		query += ` WHERE category = $1`
		args = append(args, category)
	}
	query += ` ORDER BY id`

	var err error
	if len(args) > 0 {
		err = r.db.Select(&list, query, args...)
	} else {
		err = r.db.Select(&list, query)
	}
	if err != nil {
		return nil, fmt.Errorf("list diagnostic services: %w", err)
	}

	ids := make([]int, len(list))
	for i, s := range list {
		ids[i] = s.ID
	}
	if len(ids) > 0 {
		items, err := r.findItemsByServiceIDs(ids)
		if err != nil {
			return nil, err
		}
		byService := make(map[int][]model.DiagnosticServiceItem)
		for _, it := range items {
			byService[it.ServiceID] = append(byService[it.ServiceID], it)
		}
		for i := range list {
			list[i].Items = byService[list[i].ID]
		}
	}
	return list, nil
}

// FindByID returns a diagnostic service with its items. Returns nil if not found.
func (r *DiagnosticServiceRepository) FindByID(id int) (*model.DiagnosticService, error) {
	var s model.DiagnosticService
	err := r.db.Get(&s,
		`SELECT id, category, name, description, price, is_active, created_at, updated_at
		 FROM diagnostic_services WHERE id = $1`, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("find diagnostic service: %w", err)
	}

	items, err := r.findItemsByServiceIDs([]int{id})
	if err != nil {
		return nil, err
	}
	s.Items = items
	return &s, nil
}

// Update updates a diagnostic service and replaces its items in a transaction.
// Returns false if the id does not exist.
func (r *DiagnosticServiceRepository) Update(s *model.DiagnosticService) (bool, error) {
	tx, err := r.db.Beginx()
	if err != nil {
		return false, fmt.Errorf("begin update diagnostic service: %w", err)
	}
	defer tx.Rollback()

	res, err := tx.Exec(
		`UPDATE diagnostic_services SET category = $1, name = $2, description = $3, price = $4, is_active = $5
		 WHERE id = $6`,
		s.Category, s.Name, s.Description, s.Price, s.IsActive, s.ID,
	)
	if err != nil {
		return false, fmt.Errorf("update diagnostic service: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return false, nil
	}

	if _, err := tx.Exec(`DELETE FROM diagnostic_service_items WHERE service_id = $1`, s.ID); err != nil {
		return false, fmt.Errorf("delete diagnostic service items: %w", err)
	}
	if err := insertDiagnosticItems(tx, s.ID, s.Items); err != nil {
		return false, err
	}
	if err := tx.Commit(); err != nil {
		return false, fmt.Errorf("commit update diagnostic service: %w", err)
	}
	return true, nil
}

// Delete removes a diagnostic service. Returns false if the id does not exist.
func (r *DiagnosticServiceRepository) Delete(id int) (bool, error) {
	res, err := r.db.Exec(`DELETE FROM diagnostic_services WHERE id = $1`, id)
	if err != nil {
		return false, fmt.Errorf("delete diagnostic service: %w", err)
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

func (r *DiagnosticServiceRepository) findItemsByServiceIDs(ids []int) ([]model.DiagnosticServiceItem, error) {
	var items []model.DiagnosticServiceItem
	query := `SELECT id, service_id, name, description, position
	           FROM diagnostic_service_items WHERE service_id = ANY($1)
	           ORDER BY service_id, position, id`
	err := r.db.Select(&items, query, pq.Array(ids))
	if err != nil {
		return nil, fmt.Errorf("list diagnostic service items: %w", err)
	}
	return items, nil
}

func insertDiagnosticItems(tx *sqlx.Tx, serviceID int, items []model.DiagnosticServiceItem) error {
	for i, item := range items {
		_, err := tx.Exec(
			`INSERT INTO diagnostic_service_items (service_id, name, description, position)
			 VALUES ($1, $2, $3, $4)`,
			serviceID, item.Name, item.Description, i,
		)
		if err != nil {
			return fmt.Errorf("create diagnostic service item: %w", err)
		}
	}
	return nil
}
