CREATE TABLE builds (
  id text PRIMARY KEY,
  current_revision_id text,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  name_by_locale jsonb NOT NULL DEFAULT '{}'::jsonb,
  description_by_locale jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE build_revisions (
  id text PRIMARY KEY,
  build_id text NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  revision_number integer NOT NULL CHECK (revision_number > 0),
  current_party jsonb NOT NULL,
  planned_party jsonb NOT NULL,
  stage_settings jsonb NOT NULL,
  custom_stages jsonb NOT NULL DEFAULT '[]'::jsonb,
  damage_tally_timing jsonb NOT NULL,
  compare_settings jsonb NOT NULL,
  enemy_slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  targeted_enemy_slot_id text,
  selected_enemy_id text NOT NULL,
  enemy_level integer NOT NULL,
  active_rotation_id text,
  UNIQUE (build_id, revision_number)
);

ALTER TABLE builds
  ADD CONSTRAINT builds_current_revision_fk
  FOREIGN KEY (current_revision_id) REFERENCES build_revisions(id);

-- Denormalized list projection. List endpoints read this table without loading
-- current_party, planned_party, rotations, triggers, or steps.
-- Read-optimized projection produced during structurally validated submission.
-- The selected stage is the effective stage of the preview/final rotation chain.
CREATE TABLE build_previews (
  build_id text PRIMARY KEY REFERENCES builds(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  name_by_locale jsonb NOT NULL DEFAULT '{}'::jsonb,
  description_by_locale jsonb NOT NULL DEFAULT '{}'::jsonb,
  slots jsonb NOT NULL,
  selected_stage_kind text NOT NULL CHECK (selected_stage_kind IN ('preset', 'custom')),
  selected_stage_id text NOT NULL,
  selected_stage_name text NOT NULL,
  total_damage double precision,
  dps double precision,
  summary_updated_at bigint,
  CHECK (total_damage IS NULL OR (total_damage >= 0 AND total_damage NOT IN ('Infinity'::double precision, 'NaN'::double precision))),
  CHECK (dps IS NULL OR (dps >= 0 AND dps NOT IN ('Infinity'::double precision, 'NaN'::double precision)))
);

-- Searchable localized text is normalized separately. This avoids scans and
-- JSONB extraction when searching any supported locale. Keep one fallback
-- locale row (normally 'en') even when no explicit localized value exists.
CREATE TABLE build_preview_localizations (
  build_id text NOT NULL REFERENCES build_previews(build_id) ON DELETE CASCADE,
  locale text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  PRIMARY KEY (build_id, locale)
);

-- Membership projections make combined operator/weapon/gear-set filters cheap.
-- These contain the four concrete slots resolved from current_party on upload.
CREATE TABLE build_preview_operators (
  build_id text NOT NULL REFERENCES build_previews(build_id) ON DELETE CASCADE,
  slot smallint NOT NULL CHECK (slot BETWEEN 0 AND 3),
  operator_id text NOT NULL,
  PRIMARY KEY (build_id, slot)
);

CREATE TABLE build_preview_weapons (
  build_id text NOT NULL REFERENCES build_previews(build_id) ON DELETE CASCADE,
  slot smallint NOT NULL CHECK (slot BETWEEN 0 AND 3),
  weapon_id text NOT NULL,
  PRIMARY KEY (build_id, slot)
);

CREATE TABLE build_preview_gear_sets (
  build_id text NOT NULL REFERENCES build_previews(build_id) ON DELETE CASCADE,
  slot smallint NOT NULL CHECK (slot BETWEEN 0 AND 3),
  gear_set_id text NOT NULL,
  PRIMARY KEY (build_id, slot, gear_set_id)
);

CREATE TABLE rotations (
  id text PRIMARY KEY,
  revision_id text NOT NULL REFERENCES build_revisions(id) ON DELETE CASCADE,
  scheme_id text NOT NULL,
  position integer NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  name_by_locale jsonb NOT NULL DEFAULT '{}'::jsonb,
  description_by_locale jsonb NOT NULL DEFAULT '{}'::jsonb,
  simulation_mode text NOT NULL CHECK (simulation_mode IN ('independent', 'relay_from_previous')),
  team_sp_config jsonb,
  active_contracts jsonb NOT NULL DEFAULT '[]'::jsonb,
  triggers jsonb NOT NULL DEFAULT '[]'::jsonb,
  trigger_variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  stage_settings jsonb,
  UNIQUE (revision_id, position),
  UNIQUE (revision_id, scheme_id)
);

CREATE TABLE rotation_steps (
  rotation_id text NOT NULL REFERENCES rotations(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  step_id text NOT NULL,
  slot smallint NOT NULL CHECK (slot BETWEEN 0 AND 3),
  command_id text NOT NULL,
  start_time double precision,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (rotation_id, step_id),
  UNIQUE (rotation_id, sequence)
);

CREATE TABLE enemy_steps (
  rotation_id text NOT NULL REFERENCES rotations(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  step_id text NOT NULL,
  enemy_slot_id text NOT NULL,
  command_id text NOT NULL,
  start_time double precision NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (rotation_id, step_id),
  UNIQUE (rotation_id, sequence)
);

CREATE TABLE rotation_groups (
  rotation_id text NOT NULL REFERENCES rotations(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  group_id text NOT NULL,
  name text NOT NULL,
  PRIMARY KEY (rotation_id, group_id),
  UNIQUE (rotation_id, sequence)
);

CREATE TABLE crit_rigging_rules (
  rotation_id text NOT NULL REFERENCES rotations(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  rule_id text NOT NULL,
  payload jsonb NOT NULL,
  PRIMARY KEY (rotation_id, rule_id),
  UNIQUE (rotation_id, sequence)
);

CREATE TABLE simulation_summaries (
  revision_id text PRIMARY KEY REFERENCES build_revisions(id) ON DELETE CASCADE,
  total_damage double precision,
  dps double precision,
  updated_at bigint
);

CREATE INDEX rotations_revision_idx ON rotations (revision_id, position);
CREATE INDEX rotation_steps_time_idx ON rotation_steps (rotation_id, start_time, sequence);
CREATE INDEX enemy_steps_time_idx ON enemy_steps (rotation_id, start_time, sequence);
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX build_preview_name_trgm_idx ON build_preview_localizations USING gin (name gin_trgm_ops);
CREATE INDEX build_preview_description_trgm_idx ON build_preview_localizations USING gin (description gin_trgm_ops);
CREATE INDEX build_preview_operator_idx ON build_preview_operators (operator_id, build_id);
CREATE INDEX build_preview_weapon_idx ON build_preview_weapons (weapon_id, build_id);
CREATE INDEX build_preview_gear_set_idx ON build_preview_gear_sets (gear_set_id, build_id);
CREATE INDEX build_preview_stage_idx ON build_previews (selected_stage_kind, selected_stage_id, build_id);
CREATE INDEX build_preview_damage_idx ON build_previews (total_damage, build_id);
CREATE INDEX build_preview_dps_idx ON build_previews (dps, build_id);
