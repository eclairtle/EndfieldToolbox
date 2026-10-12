"""PostgreSQL persistence models for the Endfield Toolbox build API.

Designed for SQLAlchemy 2.x with psycopg 3::

    DATABASE_URL=postgresql+psycopg://user:password@host/database

Use Alembic in a deployed API. ``Base.metadata.create_all()`` is suitable for
local development; the metadata hook creates pg_trgm before its GIN indexes.
The server validates structure and builds the preview projection, but does not
re-run combat simulation. Damage and DPS are client-reported summary values.
"""

from __future__ import annotations

import math
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DDL,
    Double,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    PrimaryKeyConstraint,
    SmallInteger,
    Text,
    UniqueConstraint,
    and_,
    event,
    exists,
    or_,
    select,
    create_engine,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker
from sqlalchemy.sql import Select


JsonObject = dict[str, Any]


class Base(DeclarativeBase):
    pass


def make_engine(database_url: str, *, echo: bool = False) -> Engine:
    """Create a pooled psycopg 3 engine for a FastAPI application."""
    if not database_url.startswith("postgresql+psycopg://"):
        raise ValueError("database_url must use the postgresql+psycopg driver")
    return create_engine(database_url, echo=echo, pool_pre_ping=True)


def make_session_factory(engine: Engine) -> sessionmaker[Session]:
    """Use the returned factory in a yield-based FastAPI dependency."""
    return sessionmaker(bind=engine, class_=Session, expire_on_commit=False)


# Required by the locale substring-search indexes below.
event.listen(
    Base.metadata,
    "before_create",
    DDL("CREATE EXTENSION IF NOT EXISTS pg_trgm").execute_if(dialect="postgresql"),
)


class Build(Base):
    __tablename__ = "builds"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    current_revision_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    name: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text, default="", server_default="")
    name_by_locale: Mapped[JsonObject] = mapped_column(JSONB, default=dict, server_default="{}")
    description_by_locale: Mapped[JsonObject] = mapped_column(JSONB, default=dict, server_default="{}")

    revisions: Mapped[list[BuildRevision]] = relationship(
        back_populates="build", cascade="all, delete-orphan", foreign_keys="BuildRevision.build_id"
    )
    preview: Mapped[BuildPreview | None] = relationship(
        back_populates="build", cascade="all, delete-orphan", uselist=False
    )

    __table_args__ = (
        ForeignKeyConstraint(
            ["current_revision_id"], ["build_revisions.id"],
            name="builds_current_revision_fk", use_alter=True,
        ),
    )


class BuildRevision(Base):
    __tablename__ = "build_revisions"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    build_id: Mapped[str] = mapped_column(ForeignKey("builds.id", ondelete="CASCADE"))
    revision_number: Mapped[int] = mapped_column(Integer)
    current_party: Mapped[JsonObject] = mapped_column(JSONB)
    planned_party: Mapped[JsonObject] = mapped_column(JSONB)
    stage_settings: Mapped[JsonObject] = mapped_column(JSONB)
    custom_stages: Mapped[list[Any]] = mapped_column(JSONB, default=list, server_default="[]")
    damage_tally_timing: Mapped[JsonObject] = mapped_column(JSONB)
    compare_settings: Mapped[JsonObject] = mapped_column(JSONB)
    enemy_slots: Mapped[list[Any]] = mapped_column(JSONB, default=list, server_default="[]")
    targeted_enemy_slot_id: Mapped[str | None] = mapped_column(Text)
    selected_enemy_id: Mapped[str] = mapped_column(Text)
    enemy_level: Mapped[int] = mapped_column(Integer)
    active_rotation_id: Mapped[str | None] = mapped_column(Text)

    build: Mapped[Build] = relationship(back_populates="revisions", foreign_keys=[build_id])
    rotations: Mapped[list[Rotation]] = relationship(back_populates="revision", cascade="all, delete-orphan")
    summary: Mapped[SimulationSummary | None] = relationship(
        back_populates="revision", cascade="all, delete-orphan", uselist=False
    )

    __table_args__ = (
        CheckConstraint("revision_number > 0", name="build_revision_number_positive"),
        UniqueConstraint("build_id", "revision_number", name="build_revision_number_uq"),
    )


class BuildPreview(Base):
    __tablename__ = "build_previews"

    build_id: Mapped[str] = mapped_column(ForeignKey("builds.id", ondelete="CASCADE"), primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text, default="", server_default="")
    name_by_locale: Mapped[JsonObject] = mapped_column(JSONB, default=dict, server_default="{}")
    description_by_locale: Mapped[JsonObject] = mapped_column(JSONB, default=dict, server_default="{}")
    slots: Mapped[list[Any]] = mapped_column(JSONB)
    selected_stage_kind: Mapped[str] = mapped_column(Text)
    selected_stage_id: Mapped[str] = mapped_column(Text)
    selected_stage_name: Mapped[str] = mapped_column(Text)
    total_damage: Mapped[float | None] = mapped_column(Double)
    dps: Mapped[float | None] = mapped_column(Double)
    summary_updated_at: Mapped[int | None] = mapped_column(BigInteger)

    build: Mapped[Build] = relationship(back_populates="preview")
    localizations: Mapped[list[BuildPreviewLocalization]] = relationship(cascade="all, delete-orphan")
    operators: Mapped[list[BuildPreviewOperator]] = relationship(cascade="all, delete-orphan")
    weapons: Mapped[list[BuildPreviewWeapon]] = relationship(cascade="all, delete-orphan")
    gear_sets: Mapped[list[BuildPreviewGearSet]] = relationship(cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("selected_stage_kind IN ('preset', 'custom')", name="build_preview_stage_kind_ck"),
        CheckConstraint(
            "total_damage IS NULL OR (total_damage >= 0 AND total_damage NOT IN ('Infinity'::double precision, 'NaN'::double precision))",
            name="build_preview_damage_finite_ck",
        ),
        CheckConstraint(
            "dps IS NULL OR (dps >= 0 AND dps NOT IN ('Infinity'::double precision, 'NaN'::double precision))",
            name="build_preview_dps_finite_ck",
        ),
        Index("build_preview_stage_idx", "selected_stage_kind", "selected_stage_id", "build_id"),
        Index("build_preview_damage_idx", "total_damage", "build_id"),
        Index("build_preview_dps_idx", "dps", "build_id"),
    )


class BuildPreviewLocalization(Base):
    __tablename__ = "build_preview_localizations"

    build_id: Mapped[str] = mapped_column(ForeignKey("build_previews.build_id", ondelete="CASCADE"))
    locale: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text, default="", server_default="")

    __table_args__ = (
        PrimaryKeyConstraint("build_id", "locale"),
        Index("build_preview_name_trgm_idx", "name", postgresql_using="gin", postgresql_ops={"name": "gin_trgm_ops"}),
        Index(
            "build_preview_description_trgm_idx", "description",
            postgresql_using="gin", postgresql_ops={"description": "gin_trgm_ops"},
        ),
    )


class BuildPreviewOperator(Base):
    __tablename__ = "build_preview_operators"
    build_id: Mapped[str] = mapped_column(ForeignKey("build_previews.build_id", ondelete="CASCADE"))
    slot: Mapped[int] = mapped_column(SmallInteger)
    operator_id: Mapped[str] = mapped_column(Text)
    __table_args__ = (
        PrimaryKeyConstraint("build_id", "slot"),
        CheckConstraint("slot BETWEEN 0 AND 3", name="build_preview_operator_slot_ck"),
        Index("build_preview_operator_idx", "operator_id", "build_id"),
    )


class BuildPreviewWeapon(Base):
    __tablename__ = "build_preview_weapons"
    build_id: Mapped[str] = mapped_column(ForeignKey("build_previews.build_id", ondelete="CASCADE"))
    slot: Mapped[int] = mapped_column(SmallInteger)
    weapon_id: Mapped[str] = mapped_column(Text)
    __table_args__ = (
        PrimaryKeyConstraint("build_id", "slot"),
        CheckConstraint("slot BETWEEN 0 AND 3", name="build_preview_weapon_slot_ck"),
        Index("build_preview_weapon_idx", "weapon_id", "build_id"),
    )


class BuildPreviewGearSet(Base):
    __tablename__ = "build_preview_gear_sets"
    build_id: Mapped[str] = mapped_column(ForeignKey("build_previews.build_id", ondelete="CASCADE"))
    slot: Mapped[int] = mapped_column(SmallInteger)
    gear_set_id: Mapped[str] = mapped_column(Text)
    __table_args__ = (
        PrimaryKeyConstraint("build_id", "slot", "gear_set_id"),
        CheckConstraint("slot BETWEEN 0 AND 3", name="build_preview_gear_set_slot_ck"),
        Index("build_preview_gear_set_idx", "gear_set_id", "build_id"),
    )


class Rotation(Base):
    __tablename__ = "rotations"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    revision_id: Mapped[str] = mapped_column(ForeignKey("build_revisions.id", ondelete="CASCADE"))
    scheme_id: Mapped[str] = mapped_column(Text)
    position: Mapped[int] = mapped_column(Integer)
    name: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text, default="", server_default="")
    name_by_locale: Mapped[JsonObject] = mapped_column(JSONB, default=dict, server_default="{}")
    description_by_locale: Mapped[JsonObject] = mapped_column(JSONB, default=dict, server_default="{}")
    simulation_mode: Mapped[str] = mapped_column(Text)
    team_sp_config: Mapped[JsonObject | None] = mapped_column(JSONB)
    active_contracts: Mapped[list[Any]] = mapped_column(JSONB, default=list, server_default="[]")
    triggers: Mapped[list[Any]] = mapped_column(JSONB, default=list, server_default="[]")
    trigger_variables: Mapped[list[Any]] = mapped_column(JSONB, default=list, server_default="[]")
    stage_settings: Mapped[JsonObject | None] = mapped_column(JSONB)

    revision: Mapped[BuildRevision] = relationship(back_populates="rotations")
    steps: Mapped[list[RotationStep]] = relationship(cascade="all, delete-orphan")
    enemy_steps: Mapped[list[EnemyStep]] = relationship(cascade="all, delete-orphan")
    groups: Mapped[list[RotationGroup]] = relationship(cascade="all, delete-orphan")
    crit_rigging_rules: Mapped[list[CritRiggingRule]] = relationship(cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("simulation_mode IN ('independent', 'relay_from_previous')", name="rotation_mode_ck"),
        UniqueConstraint("revision_id", "position", name="rotation_position_uq"),
        UniqueConstraint("revision_id", "scheme_id", name="rotation_scheme_uq"),
        Index("rotations_revision_idx", "revision_id", "position"),
    )


class RotationStep(Base):
    __tablename__ = "rotation_steps"
    rotation_id: Mapped[str] = mapped_column(ForeignKey("rotations.id", ondelete="CASCADE"))
    sequence: Mapped[int] = mapped_column(Integer)
    step_id: Mapped[str] = mapped_column(Text)
    slot: Mapped[int] = mapped_column(SmallInteger)
    command_id: Mapped[str] = mapped_column(Text)
    start_time: Mapped[float | None] = mapped_column(Double)
    payload: Mapped[JsonObject] = mapped_column(JSONB, default=dict, server_default="{}")
    __table_args__ = (
        PrimaryKeyConstraint("rotation_id", "step_id"),
        UniqueConstraint("rotation_id", "sequence"),
        CheckConstraint("slot BETWEEN 0 AND 3", name="rotation_step_slot_ck"),
        Index("rotation_steps_time_idx", "rotation_id", "start_time", "sequence"),
    )


class EnemyStep(Base):
    __tablename__ = "enemy_steps"
    rotation_id: Mapped[str] = mapped_column(ForeignKey("rotations.id", ondelete="CASCADE"))
    sequence: Mapped[int] = mapped_column(Integer)
    step_id: Mapped[str] = mapped_column(Text)
    enemy_slot_id: Mapped[str] = mapped_column(Text)
    command_id: Mapped[str] = mapped_column(Text)
    start_time: Mapped[float] = mapped_column(Double)
    payload: Mapped[JsonObject] = mapped_column(JSONB, default=dict, server_default="{}")
    __table_args__ = (
        PrimaryKeyConstraint("rotation_id", "step_id"),
        UniqueConstraint("rotation_id", "sequence"),
        Index("enemy_steps_time_idx", "rotation_id", "start_time", "sequence"),
    )


class RotationGroup(Base):
    __tablename__ = "rotation_groups"
    rotation_id: Mapped[str] = mapped_column(ForeignKey("rotations.id", ondelete="CASCADE"))
    sequence: Mapped[int] = mapped_column(Integer)
    group_id: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    __table_args__ = (
        PrimaryKeyConstraint("rotation_id", "group_id"),
        UniqueConstraint("rotation_id", "sequence"),
    )


class CritRiggingRule(Base):
    __tablename__ = "crit_rigging_rules"
    rotation_id: Mapped[str] = mapped_column(ForeignKey("rotations.id", ondelete="CASCADE"))
    sequence: Mapped[int] = mapped_column(Integer)
    rule_id: Mapped[str] = mapped_column(Text)
    payload: Mapped[JsonObject] = mapped_column(JSONB)
    __table_args__ = (
        PrimaryKeyConstraint("rotation_id", "rule_id"),
        UniqueConstraint("rotation_id", "sequence"),
    )


class SimulationSummary(Base):
    __tablename__ = "simulation_summaries"
    revision_id: Mapped[str] = mapped_column(ForeignKey("build_revisions.id", ondelete="CASCADE"), primary_key=True)
    total_damage: Mapped[float | None] = mapped_column(Double)
    dps: Mapped[float | None] = mapped_column(Double)
    updated_at: Mapped[int | None] = mapped_column(BigInteger)
    revision: Mapped[BuildRevision] = relationship(back_populates="summary")


# ---------- FastAPI request/response schemas ----------

class VariantWeapon(BaseModel):
    model_config = ConfigDict(extra="allow")
    weaponId: str = Field(min_length=1, max_length=128)
    weaponAscension: int = Field(ge=0)
    weaponPotential: int = Field(ge=0)
    weaponLevel: int = Field(ge=1)
    weaponSkillLevels: list[int] = Field(default_factory=list, max_length=32)


class VariantGear(BaseModel):
    model_config = ConfigDict(extra="allow")
    armor: JsonObject | None = None
    gloves: JsonObject | None = None
    kit1: JsonObject | None = None
    kit2: JsonObject | None = None


class VariantBuild(BaseModel):
    model_config = ConfigDict(extra="allow")
    characterId: str = Field(min_length=1, max_length=128)
    characterAscension: int = Field(ge=0)
    characterPotential: int = Field(ge=0)
    level: int = Field(ge=1)
    characterTalentToggles: dict[str, bool] = Field(default_factory=dict)
    uniqueTalentToggles: dict[str, bool] = Field(default_factory=dict)
    characterSkillLevels: JsonObject = Field(default_factory=dict)
    weapon: VariantWeapon
    gear: VariantGear


class PartyVariant(BaseModel):
    index: int = Field(ge=0, le=3)
    build: VariantBuild | None = None
    sameAsVariantIndex: int | None = Field(default=None, ge=0, le=3)

    @model_validator(mode="after")
    def exactly_one_source(self) -> PartyVariant:
        if (self.build is None) == (self.sameAsVariantIndex is None):
            raise ValueError("variant requires exactly one of build or sameAsVariantIndex")
        if self.sameAsVariantIndex is not None and self.sameAsVariantIndex >= self.index:
            raise ValueError("sameAsVariantIndex must reference an earlier variant")
        return self


class PartySlot(BaseModel):
    slot: int = Field(ge=0, le=3)
    label: str = Field(default="", max_length=128)
    activeBuffs: list[Any] = Field(default_factory=list, max_length=128)
    variants: list[PartyVariant] = Field(min_length=4, max_length=4)

    @field_validator("variants")
    @classmethod
    def complete_variant_indexes(cls, value: list[PartyVariant]) -> list[PartyVariant]:
        if sorted(item.index for item in value) != [0, 1, 2, 3]:
            raise ValueError("variants must contain indexes 0 through 3 exactly once")
        return value


class CanonicalParty(BaseModel):
    activeVariantIndex: int = Field(ge=0, le=3)
    slots: list[PartySlot] = Field(min_length=4, max_length=4)

    @field_validator("slots")
    @classmethod
    def complete_slot_indexes(cls, value: list[PartySlot]) -> list[PartySlot]:
        if sorted(item.slot for item in value) != [0, 1, 2, 3]:
            raise ValueError("party must contain slots 0 through 3 exactly once")
        return value


class PreviewSlot(BaseModel):
    slot: int = Field(ge=0, le=3)
    characterId: str = Field(min_length=1, max_length=128)
    weaponId: str = Field(min_length=1, max_length=128)
    gearIds: list[str | None] = Field(min_length=4, max_length=4)
    gearSetIds: list[str] = Field(default_factory=list, max_length=4)


class PreviewStage(BaseModel):
    kind: Literal["preset", "custom"]
    id: str = Field(min_length=1, max_length=128)
    name: str = Field(min_length=1, max_length=200)
    nameByLocale: dict[str, str] = Field(default_factory=dict)


class SubmittedSummary(BaseModel):
    totalDamage: float | None = Field(default=None, ge=0)
    dps: float | None = Field(default=None, ge=0)
    updatedAt: int | None = Field(default=None, ge=0)

    @field_validator("totalDamage", "dps")
    @classmethod
    def finite_number(cls, value: float | None) -> float | None:
        if value is not None and not math.isfinite(value):
            raise ValueError("summary values must be finite")
        return value


class BuildPreviewPayload(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=10_000)
    nameByLocale: dict[str, str] = Field(default_factory=dict)
    descriptionByLocale: dict[str, str] = Field(default_factory=dict)
    slots: list[PreviewSlot] = Field(min_length=4, max_length=4)
    stage: PreviewStage
    summary: SubmittedSummary

    @field_validator("slots")
    @classmethod
    def concrete_slots(cls, value: list[PreviewSlot]) -> list[PreviewSlot]:
        if sorted(slot.slot for slot in value) != [0, 1, 2, 3]:
            raise ValueError("preview must contain slots 0 through 3 exactly once")
        return value


class BuildUpload(BaseModel):
    """Outer upload envelope; evolving build internals remain JSON-compatible."""

    schemaVersion: Literal[1]
    currentParty: CanonicalParty
    plannedParty: CanonicalParty
    preview: BuildPreviewPayload
    rotations: list[JsonObject] = Field(min_length=1, max_length=32)
    stageSettings: JsonObject = Field(default_factory=dict)
    customStages: list[JsonObject] = Field(default_factory=list, max_length=3)

    @model_validator(mode="after")
    def preview_matches_selected_current_party(self) -> BuildUpload:
        slots = {slot.slot: slot for slot in self.currentParty.slots}
        previews = {slot.slot: slot for slot in self.preview.slots}
        for slot_index in range(4):
            variants = {variant.index: variant for variant in slots[slot_index].variants}
            selected_index = self.currentParty.activeVariantIndex
            seen: set[int] = set()
            while variants[selected_index].build is None:
                if selected_index in seen:
                    raise ValueError("cyclic sameAsVariantIndex reference")
                seen.add(selected_index)
                selected_index = variants[selected_index].sameAsVariantIndex  # type: ignore[assignment]
            selected = variants[selected_index].build
            assert selected is not None
            preview = previews[slot_index]
            gear_ids = []
            for gear in (selected.gear.armor, selected.gear.gloves, selected.gear.kit1, selected.gear.kit2):
                raw_id = gear.get("gearId") if gear else None
                gear_ids.append(str(raw_id) if raw_id is not None else None)
            if preview.characterId != selected.characterId:
                raise ValueError(f"preview operator mismatch in slot {slot_index}")
            if preview.weaponId != selected.weapon.weaponId:
                raise ValueError(f"preview weapon mismatch in slot {slot_index}")
            if preview.gearIds != gear_ids:
                raise ValueError(f"preview gear mismatch in slot {slot_index}")
        return self


class BuildPreviewResponse(BuildPreviewPayload):
    buildId: str


class BuildPreviewFilters(BaseModel):
    locale: str | None = None
    text: str | None = Field(default=None, max_length=200)
    search_description: bool = False
    operator_ids: list[str] = Field(default_factory=list, max_length=4)
    weapon_ids: list[str] = Field(default_factory=list, max_length=4)
    gear_set_ids: list[str] = Field(default_factory=list, max_length=16)
    stage_kind: Literal["preset", "custom"] | None = None
    stage_id: str | None = None
    min_total_damage: float | None = Field(default=None, ge=0)
    max_total_damage: float | None = Field(default=None, ge=0)
    min_dps: float | None = Field(default=None, ge=0)
    max_dps: float | None = Field(default=None, ge=0)


def build_preview_select(filters: BuildPreviewFilters) -> Select[tuple[BuildPreview]]:
    """Build an AND-combined, index-friendly preview query.

    Repeating EXISTS for membership fields means a build must contain every
    requested ID. Change each loop to one ``.in_(...)`` EXISTS if matching any
    selected ID is preferred by the API.
    """

    statement = select(BuildPreview)
    if filters.text:
        text_pattern = f"%{filters.text}%"
        text_terms = [BuildPreviewLocalization.name.ilike(text_pattern)]
        if filters.search_description:
            text_terms.append(BuildPreviewLocalization.description.ilike(text_pattern))
        localization_predicates = [
            BuildPreviewLocalization.build_id == BuildPreview.build_id,
            or_(*text_terms),
        ]
        if filters.locale:
            localization_predicates.append(BuildPreviewLocalization.locale == filters.locale)
        statement = statement.where(exists().where(and_(*localization_predicates)))

    for operator_id in set(filters.operator_ids):
        statement = statement.where(exists().where(and_(
            BuildPreviewOperator.build_id == BuildPreview.build_id,
            BuildPreviewOperator.operator_id == operator_id,
        )))
    for weapon_id in set(filters.weapon_ids):
        statement = statement.where(exists().where(and_(
            BuildPreviewWeapon.build_id == BuildPreview.build_id,
            BuildPreviewWeapon.weapon_id == weapon_id,
        )))
    for gear_set_id in set(filters.gear_set_ids):
        statement = statement.where(exists().where(and_(
            BuildPreviewGearSet.build_id == BuildPreview.build_id,
            BuildPreviewGearSet.gear_set_id == gear_set_id,
        )))

    if filters.stage_kind:
        statement = statement.where(BuildPreview.selected_stage_kind == filters.stage_kind)
    if filters.stage_id:
        statement = statement.where(BuildPreview.selected_stage_id == filters.stage_id)
    if filters.min_total_damage is not None:
        statement = statement.where(BuildPreview.total_damage >= filters.min_total_damage)
    if filters.max_total_damage is not None:
        statement = statement.where(BuildPreview.total_damage <= filters.max_total_damage)
    if filters.min_dps is not None:
        statement = statement.where(BuildPreview.dps >= filters.min_dps)
    if filters.max_dps is not None:
        statement = statement.where(BuildPreview.dps <= filters.max_dps)
    return statement.order_by(BuildPreview.total_damage.desc().nulls_last(), BuildPreview.build_id)
