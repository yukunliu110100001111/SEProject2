#!/usr/bin/env bash
set -euo pipefail

PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-55432}"
PGUSER="${PGUSER:-meal_user}"
PGPASSWORD="${PGPASSWORD:-meal_password}"
PGDATABASE="${PGDATABASE:-meal_recommendation}"
export PGPASSWORD

psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" <<'SQL'
BEGIN;

INSERT INTO ingredients(name) VALUES
('Salmon'),
('Quinoa'),
('Spinach'),
('Tomato'),
('Tofu'),
('Brown Rice')
ON CONFLICT (name) DO NOTHING;

INSERT INTO allergens(name) VALUES
('fish'),
('soy'),
('nut')
ON CONFLICT (name) DO NOTHING;

INSERT INTO stock_records(ingredient_id, current_qty_g, expiry_date)
SELECT i.ingredient_id, v.qty, v.expiry
FROM (VALUES
  ('Salmon', 4200, CURRENT_DATE + 4),
  ('Quinoa', 7600, CURRENT_DATE + 30),
  ('Spinach', 1900, CURRENT_DATE + 2),
  ('Tomato', 5200, CURRENT_DATE + 5),
  ('Tofu', 6800, CURRENT_DATE + 10),
  ('Brown Rice', 9000, CURRENT_DATE + 60)
) AS v(name, qty, expiry)
JOIN ingredients i ON i.name = v.name;

INSERT INTO ingredient_allergens(ingredient_id, allergen_id)
SELECT i.ingredient_id, a.allergen_id
FROM (VALUES
  ('Salmon', 'fish'),
  ('Tofu', 'soy')
) AS v(ingredient_name, allergen_name)
JOIN ingredients i ON i.name = v.ingredient_name
JOIN allergens a ON a.name = v.allergen_name
WHERE NOT EXISTS (
  SELECT 1 FROM ingredient_allergens ia
  WHERE ia.ingredient_id = i.ingredient_id AND ia.allergen_id = a.allergen_id
);

INSERT INTO meals(name, description, calories, protein, sustainability_score, is_deleted)
SELECT x.name, x.description, x.calories, x.protein, x.score, FALSE
FROM (VALUES
  ('Salmon Quinoa Bowl', 'high-protein omega bowl', 520, 34, 8),
  ('Tofu Veggie Plate', 'plant protein with greens', 410, 24, 9),
  ('Mediterranean Rice', 'tomato rice light meal', 460, 16, 7)
) AS x(name, description, calories, protein, score)
WHERE NOT EXISTS (SELECT 1 FROM meals m WHERE m.name = x.name);

INSERT INTO meal_ingredients(meal_id, ingredient_id, weight_g)
SELECT m.meal_id, i.ingredient_id, r.weight
FROM (VALUES
  ('Salmon Quinoa Bowl', 'Salmon', 160),
  ('Salmon Quinoa Bowl', 'Quinoa', 120),
  ('Salmon Quinoa Bowl', 'Spinach', 70),
  ('Tofu Veggie Plate', 'Tofu', 180),
  ('Tofu Veggie Plate', 'Spinach', 80),
  ('Tofu Veggie Plate', 'Tomato', 90),
  ('Mediterranean Rice', 'Brown Rice', 150),
  ('Mediterranean Rice', 'Tomato', 120),
  ('Mediterranean Rice', 'Spinach', 60)
) AS r(meal_name, ingredient_name, weight)
JOIN meals m ON m.name = r.meal_name
JOIN ingredients i ON i.name = r.ingredient_name
WHERE NOT EXISTS (
  SELECT 1 FROM meal_ingredients mi
  WHERE mi.meal_id = m.meal_id AND mi.ingredient_id = i.ingredient_id
);

INSERT INTO sustainability_tags(tag_name, score_weight)
VALUES
('eco-packaging', 1),
('low-carbon', 1),
('plant-based', 1)
ON CONFLICT (tag_name) DO NOTHING;

INSERT INTO meal_sustainability_tags(meal_id, tag_id)
SELECT m.meal_id, t.tag_id
FROM (VALUES
  ('Salmon Quinoa Bowl', 'low-carbon'),
  ('Tofu Veggie Plate', 'plant-based'),
  ('Tofu Veggie Plate', 'eco-packaging'),
  ('Mediterranean Rice', 'low-carbon')
) AS v(meal_name, tag_name)
JOIN meals m ON m.name = v.meal_name
JOIN sustainability_tags t ON t.tag_name = v.tag_name
WHERE NOT EXISTS (
  SELECT 1 FROM meal_sustainability_tags mst
  WHERE mst.meal_id = m.meal_id AND mst.tag_id = t.tag_id
);

COMMIT;
SQL

echo "[seed] realistic data inserted"
