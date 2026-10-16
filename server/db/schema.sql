-- NaviFreight Maritime Intelligence Relational Schema (SQLite / PostgreSQL Compatible)

-- 1. Ports Table: Authoritative physical constraints & MoPSW operational benchmarks
CREATE TABLE IF NOT EXISTS ports (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    region TEXT NOT NULL,
    is_indian_east_coast INTEGER NOT NULL DEFAULT 0,
    max_draft_meters REAL NOT NULL,
    max_loa_meters REAL NOT NULL,
    max_beam_meters REAL NOT NULL,
    handling_rate_tpd REAL NOT NULL,
    average_turnaround_hours REAL NOT NULL,
    berth_count INTEGER NOT NULL,
    congestion_status TEXT NOT NULL CHECK(congestion_status IN ('Low', 'Normal', 'Elevated', 'Congested')),
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    key_commodities TEXT NOT NULL, -- JSON array of strings
    notes TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. Vessels Table: Fleet specifications, bunker consumption & commercial hire rates
CREATE TABLE IF NOT EXISTS vessels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    vessel_class TEXT NOT NULL CHECK(vessel_class IN ('Handysize', 'Supramax', 'Panamax', 'Capesize')),
    dwt REAL NOT NULL,
    draft_meters REAL NOT NULL,
    loa_meters REAL NOT NULL,
    beam_meters REAL NOT NULL,
    year_built INTEGER NOT NULL,
    flag TEXT NOT NULL,
    current_location TEXT NOT NULL,
    speed_knots REAL NOT NULL,
    bunker_consumption_sea_tpd REAL NOT NULL,
    bunker_consumption_port_tpd REAL NOT NULL,
    daily_hire_rate_usd REAL NOT NULL,
    gear_description TEXT NOT NULL,
    suitability_score_default INTEGER NOT NULL DEFAULT 85,
    available_from TEXT NOT NULL,
    available_to TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 3. Commodities Table: Parcel sizes, density & bulk stowage factors
CREATE TABLE IF NOT EXISTS commodities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('Dry Bulk', 'Mineral', 'Agricultural')),
    default_parcel_size_mt REAL NOT NULL,
    density_tons_m3 REAL NOT NULL,
    stowage_factor REAL NOT NULL,
    description TEXT NOT NULL
);

-- 4. Historical Freight Rates & Indices
CREATE TABLE IF NOT EXISTS historical_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    origin_port_id TEXT NOT NULL,
    dest_port_id TEXT NOT NULL,
    commodity_id TEXT NOT NULL,
    vessel_class TEXT NOT NULL,
    date TEXT NOT NULL,
    rate_usd REAL NOT NULL,
    bunker_price_usd REAL NOT NULL,
    baltic_index REAL NOT NULL,
    is_forecast INTEGER NOT NULL DEFAULT 0,
    lower_confidence REAL,
    upper_confidence REAL,
    event_note TEXT
);

-- 5. Simulations Table: Saved procurement scenarios & stress tests
CREATE TABLE IF NOT EXISTS simulations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    origin_port_id TEXT NOT NULL,
    dest_port_id TEXT NOT NULL,
    commodity_id TEXT NOT NULL,
    cargo_quantity_mt REAL NOT NULL,
    target_arrival_date TEXT NOT NULL,
    horizon_days INTEGER NOT NULL DEFAULT 60,
    bunker_price_per_mt REAL NOT NULL DEFAULT 624,
    port_congestion_days REAL NOT NULL DEFAULT 1.5,
    market_volatility_shock REAL NOT NULL DEFAULT 0,
    recommended_vessel_id TEXT,
    optimal_cost_per_ton REAL,
    total_cost_usd REAL,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 6. Shipments Table: Live bulk carrier voyages & AIS tracking
CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY,
    commodity TEXT NOT NULL,
    quantity_mt REAL NOT NULL,
    origin_port TEXT NOT NULL,
    destination_port TEXT NOT NULL,
    vessel_name TEXT NOT NULL,
    vessel_class TEXT NOT NULL,
    speed_knots REAL NOT NULL,
    course_degrees REAL NOT NULL,
    transit_corridor TEXT NOT NULL,
    arrival_date TEXT NOT NULL,
    freight_rate_usd REAL NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Planned', 'In Transit', 'Discharging', 'Completed', 'Sunda Transit', 'Laden', 'En Route'))
);

-- 7. Decision Briefs & Executive Reports
CREATE TABLE IF NOT EXISTS decision_briefs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    simulation_id TEXT,
    route_description TEXT NOT NULL,
    optimal_vessel_name TEXT NOT NULL,
    cargo_quantity_mt REAL NOT NULL,
    freight_rate_per_ton REAL NOT NULL,
    total_cost_usd REAL NOT NULL,
    risk_level TEXT NOT NULL CHECK(risk_level IN ('Low', 'Medium', 'High', 'Critical')),
    key_findings TEXT NOT NULL,
    mopsw_benchmark_compliance TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Approved',
    generated_at TEXT DEFAULT (datetime('now'))
);

-- 8. Market Feeds Table: Dynamic bunker prices & Baltic dry index proxies
CREATE TABLE IF NOT EXISTS market_feeds (
    feed_key TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    source TEXT NOT NULL,
    last_updated TEXT DEFAULT (datetime('now'))
);

-- 9. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    timestamp TEXT DEFAULT (datetime('now'))
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_ports_east_coast ON ports(is_indian_east_coast);
CREATE INDEX IF NOT EXISTS idx_vessels_class ON vessels(vessel_class);
CREATE INDEX IF NOT EXISTS idx_simulations_created ON simulations(created_at);
CREATE INDEX IF NOT EXISTS idx_historical_rates_route ON historical_rates(origin_port_id, dest_port_id);
