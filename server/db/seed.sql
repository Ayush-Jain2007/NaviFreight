-- NaviFreight Seed Data (Authoritative MoPSW and Baltic Dry Index Proxies)

-- 1. Insert Indian East Coast & Overseas Ports
INSERT OR REPLACE INTO ports (id, name, country, region, is_indian_east_coast, max_draft_meters, max_loa_meters, max_beam_meters, handling_rate_tpd, average_turnaround_hours, berth_count, congestion_status, latitude, longitude, key_commodities, notes) VALUES
('paradip', 'Paradip Port', 'India', 'East Coast (Odisha)', 1, 14.5, 230.0, 32.5, 45000, 48.2, 16, 'Normal', 20.2644, 86.6713, '["Iron Ore", "Coking Coal", "Thermal Coal"]', 'Max draft 14.5m accommodates Panamax/Kamsarmax. Capesize requires offshore lighterage or deep-water single buoy.'),
('vizag_outer', 'Visakhapatnam (Outer Harbour)', 'India', 'East Coast (Andhra Pradesh)', 1, 18.5, 300.0, 48.0, 55000, 44.0, 8, 'Low', 17.6868, 83.2185, '["Iron Ore", "Coking Coal", "Petroleum"]', 'Deep-water natural outer harbour. Fully equipped for Capesize vessels up to 200,000 DWT.'),
('vizag_inner', 'Visakhapatnam (Inner Harbour)', 'India', 'East Coast (Andhra Pradesh)', 1, 11.5, 195.0, 32.0, 28000, 52.5, 14, 'Normal', 17.6950, 83.2900, '["Fertilizers", "Bauxite", "General Cargo"]', 'Draft-constrained channel. Strictly Supramax and Handysize compliant.'),
('dhamra', 'Dhamra Port', 'India', 'East Coast (Odisha)', 1, 18.0, 310.0, 50.0, 65000, 36.8, 5, 'Low', 20.8030, 86.9630, '["Coking Coal", "Thermal Coal", "Iron Ore"]', 'Private deep-water all-weather port. Highest discharge rate in Odisha for Capesize coal carriers.'),
('haldia', 'Haldia Dock Complex', 'India', 'East Coast (West Bengal)', 1, 8.5, 190.0, 30.5, 22000, 64.2, 12, 'Elevated', 22.0257, 88.0583, '["Coking Coal", "Thermal Coal", "Bauxite"]', 'Riverine port with severe Hooghly bars and draft limitations (7.5-8.5m). Requires shallow Handysize or Sandheads transshipment.'),
('gangavaram', 'Gangavaram Port', 'India', 'East Coast (Andhra Pradesh)', 1, 18.2, 305.0, 48.0, 58000, 41.5, 9, 'Normal', 17.6253, 83.2355, '["Coking Coal", "Iron Ore", "Limestone"]', 'Deep-draft all-weather port directly connected to Visakhapatnam Steel Plant (RINL).'),
('kamarajar', 'Ennore (Kamarajar Port)', 'India', 'East Coast (Tamil Nadu)', 1, 16.0, 260.0, 40.0, 42000, 46.0, 8, 'Normal', 13.2667, 80.3333, '["Thermal Coal", "Iron Ore", "Automotive"]', 'Key thermal power coal receiving port for Tamil Nadu Generation and Distribution Corp.'),
('port_hedland', 'Port Hedland', 'Australia', 'Pilbara, Western Australia', 0, 19.8, 340.0, 60.0, 120000, 28.0, 20, 'Normal', -20.3167, 118.5760, '["Iron Ore", "Lithium", "Salt"]', 'Highest throughput bulk export terminal globally. World leader in Capesize iron ore loading.'),
('newcastle', 'Newcastle Port', 'Australia', 'New South Wales', 0, 15.2, 290.0, 47.0, 85000, 34.0, 15, 'Normal', -32.9267, 151.7817, '["Coking Coal", "Thermal Coal"]', 'World premier coal shipping hub. Standard origin for metallurgical coal bound for Indian blast furnaces.'),
('richards_bay', 'Richards Bay Coal Terminal (RBCT)', 'South Africa', 'KwaZulu-Natal', 0, 17.5, 310.0, 50.0, 90000, 38.0, 6, 'Elevated', -28.8000, 32.0833, '["Thermal Coal", "Coking Coal", "Titanium"]', 'Major African export artery for Indian East Coast power and cement plants.'),
('dalrymple_bay', 'Dalrymple Bay / Hay Point', 'Australia', 'Queensland', 0, 18.5, 320.0, 50.0, 95000, 32.0, 8, 'Normal', -21.2833, 149.2833, '["Coking Coal"]', 'Prime loading port for premium Bowen Basin metallurgical coal.'),
('norfolk', 'Norfolk / Hampton Roads', 'United States', 'Virginia', 0, 15.5, 290.0, 45.0, 65000, 36.0, 10, 'Normal', 36.8508, -76.2859, '["Coking / Met Coal", "Thermal Coal"]', 'Norfolk Southern Pier 6 is premier North American coal loading facility for Indian blast furnaces.'),
('baltimore', 'Port of Baltimore (Curtis Bay)', 'United States', 'Maryland', 0, 15.2, 290.0, 45.0, 60000, 38.0, 12, 'Normal', 39.2200, -76.5800, '["Coking / Met Coal", "Thermal Coal"]', 'Consol Marine and CSX Curtis Bay deepwater coal export piers.'),
('houston', 'Port of Houston', 'United States', 'Texas', 0, 14.0, 270.0, 40.0, 60000, 36.0, 30, 'Normal', 29.7604, -95.3698, '["Petcoke", "Steel", "Chemicals"]', 'Largest foreign waterborne tonnage port in the US.'),
('new_orleans', 'Port of New Orleans / Mississippi', 'United States', 'Louisiana', 0, 14.5, 260.0, 36.0, 55000, 40.0, 20, 'Normal', 29.9511, -90.0715, '["Grain / Agri Bulk", "Petcoke"]', 'Midwest grain and bulk export gateway on the lower Mississippi.'),
('odesa', 'Port of Odesa', 'Ukraine', 'Black Sea', 0, 14.0, 270.0, 38.0, 50000, 38.0, 16, 'Normal', 46.4846, 30.7431, '["Grain (Wheat, Corn)", "Iron Ore Pellets", "Steel"]', 'Premier historical deepwater seaport of Ukraine on the Black Sea.'),
('pivdennyi', 'Port of Pivdennyi (Yuzhny)', 'Ukraine', 'Black Sea', 0, 18.5, 320.0, 50.0, 85000, 32.0, 10, 'Low', 46.6028, 31.0211, '["Iron Ore Pellets (Ferrexpo)", "Grain", "Coal"]', 'Deepest port in Ukraine (up to 18.5m draft), equipped for fully laden Capesize iron ore export.'),
('chornomorsk', 'Port of Chornomorsk', 'Ukraine', 'Black Sea', 0, 14.5, 260.0, 36.0, 45000, 36.0, 14, 'Normal', 46.3014, 30.6572, '["Grain / Agri Bulk", "Metals"]', 'Specialized Black Sea agricultural bulk and rail ferry terminal.');

-- 2. Insert Bulk Carrier Fleet
INSERT OR REPLACE INTO vessels (id, name, vessel_class, dwt, draft_meters, loa_meters, beam_meters, year_built, flag, current_location, speed_knots, bunker_consumption_sea_tpd, bunker_consumption_port_tpd, daily_hire_rate_usd, gear_description, suitability_score_default, available_from, available_to) VALUES
('vessel_1', 'MV Blue Horizon', 'Panamax', 76000, 14.18, 225.0, 32.26, 2019, 'Liberia', 'Malacca Strait (Ballasting)', 13.2, 24.5, 3.2, 17200, 'Gearless (Bulk Carrier)', 92, '2026-03-01', '2026-03-12'),
('vessel_2', 'MV Queen Mary', 'Supramax', 58000, 12.80, 189.9, 32.26, 2021, 'Panama', 'Bay of Bengal (Open Singapore)', 13.8, 21.0, 4.5, 15400, '4 x 30t Cranes + 12m³ Grabs', 85, '2026-03-04', '2026-03-15'),
('vessel_3', 'MV Iron Leader', 'Capesize', 176500, 18.25, 289.0, 45.0, 2018, 'Marshall Islands', 'Off Western Australia', 12.6, 38.0, 3.8, 24500, 'Gearless (Capesize 9-hold)', 70, '2026-03-08', '2026-03-18'),
('vessel_4', 'MV Global Pioneer', 'Panamax', 82000, 14.45, 229.0, 32.26, 2020, 'Singapore', 'Sunda Strait (En Route Hedland)', 13.0, 25.0, 3.4, 17900, 'Gearless (Kamsarmax 7-hold)', 90, '2026-03-05', '2026-03-16'),
('vessel_5', 'MV Eastern Harmony', 'Handysize', 38500, 10.50, 179.9, 29.8, 2022, 'Japan', 'Port Klang (Open 2 Mar)', 14.0, 16.5, 4.0, 12800, '4 x 30.5t Cranes', 78, '2026-03-02', '2026-03-14'),
('vessel_6', 'MV Pacific Sentinel', 'Capesize', 181200, 18.42, 292.0, 45.0, 2017, 'Liberia', 'Port Hedland Anchorage', 12.5, 39.5, 4.1, 25200, 'Gearless', 68, '2026-03-10', '2026-03-22'),
('vessel_7', 'MV Bengal Trader', 'Supramax', 55600, 12.55, 189.99, 32.26, 2016, 'India', 'Paradip Anchorage', 13.5, 22.0, 4.2, 14900, '4 x 35t Electro-hydraulic Cranes', 88, '2026-02-28', '2026-03-10'),
('vessel_8', 'MV Kamsarmax Elite', 'Panamax', 81600, 14.40, 229.0, 32.26, 2023, 'Cyprus', 'Singapore East Anchorage', 13.4, 23.8, 3.0, 18400, 'Gearless modern eco-engine', 93, '2026-03-06', '2026-03-18');

-- 3. Insert Commodities
INSERT OR REPLACE INTO commodities (id, name, category, default_parcel_size_mt, density_tons_m3, stowage_factor, description) VALUES
('iron_ore', 'Iron Ore (Fines & Pellets)', 'Mineral', 150000, 2.30, 0.45, 'High-density heavy ore for steel making. Standard shipment sizes: 70,000 MT (Panamax) to 170,000 MT (Capesize).'),
('coking_coal', 'Coking / Metallurgical Coal', 'Dry Bulk', 75000, 0.82, 1.25, 'Crucial for blast furnaces in steel manufacturing (TATA, SAIL, JSW). Often shipped in Panamax or Supramax.'),
('thermal_coal', 'Thermal / Steam Coal', 'Dry Bulk', 80000, 0.85, 1.22, 'Used by coastal thermal generation plants. Sourced mainly from Newcastle and Richards Bay.'),
('bauxite', 'Bauxite Ore', 'Mineral', 55000, 1.25, 0.80, 'Aluminium feedstock. Supramax or Handysize preferred due to moisture and liquefaction management regulations.'),
('limestone', 'Limestone Flux', 'Mineral', 45000, 1.45, 0.72, 'Steel fluxing agent. Typically moved in Handymax and Supramax parcels.');

-- 4. Insert Historical Freight Rates & Time-Series Data
INSERT OR REPLACE INTO historical_rates (id, origin_port_id, dest_port_id, commodity_id, vessel_class, date, rate_usd, bunker_price_usd, baltic_index, is_forecast, lower_confidence, upper_confidence, event_note) VALUES
(1, 'port_hedland', 'paradip', 'iron_ore', 'Panamax', 'Jan 2024', 21.5, 595, 1420, 0, NULL, NULL, 'Post-holiday lull'),
(2, 'port_hedland', 'paradip', 'iron_ore', 'Panamax', 'Feb 2024', 26.2, 615, 1680, 0, NULL, NULL, 'Australia weather disruption surge'),
(3, 'port_hedland', 'paradip', 'iron_ore', 'Panamax', 'Apr 2024', 22.0, 608, 1510, 0, NULL, NULL, 'Fleet supply rebalance'),
(4, 'port_hedland', 'paradip', 'iron_ore', 'Panamax', 'May 2024', 24.8, 620, 1620, 0, NULL, NULL, 'Pre-monsoon inventory build'),
(5, 'port_hedland', 'paradip', 'iron_ore', 'Panamax', 'Jul 2024', 31.0, 642, 1980, 0, NULL, NULL, 'Monsoon waiting delays at Paradip'),
(6, 'port_hedland', 'paradip', 'iron_ore', 'Panamax', 'Aug 2024', 27.5, 630, 1750, 0, NULL, NULL, 'Post-cyclone recovery'),
(7, 'port_hedland', 'paradip', 'iron_ore', 'Panamax', 'Oct 2024', 23.4, 618, 1590, 0, NULL, NULL, 'Seasonal demand moderation'),
(8, 'port_hedland', 'paradip', 'iron_ore', 'Panamax', 'Nov 2024', 21.0, 605, 1480, 0, NULL, NULL, 'Soft steel margins'),
(9, 'port_hedland', 'paradip', 'iron_ore', 'Panamax', 'Jan 2025', 24.8, 622, 1640, 0, NULL, NULL, 'Q1 procurement restart'),
(10, 'port_hedland', 'paradip', 'iron_ore', 'Panamax', 'Feb 2025', 25.5, 624, 1680, 1, 22.0, 28.5, 'AI Forecast Base'),
(11, 'port_hedland', 'paradip', 'iron_ore', 'Panamax', 'Apr 2025', 26.2, 630, 1720, 1, 22.5, 29.8, 'Expected steel mill ramping'),
(12, 'port_hedland', 'paradip', 'iron_ore', 'Panamax', 'Jul 2025', 28.5, 640, 1850, 1, 23.8, 33.0, 'Bay of Bengal monsoon hazard window'),
(13, 'port_hedland', 'paradip', 'iron_ore', 'Panamax', 'Oct 2025', 29.8, 645, 1910, 1, 24.0, 35.0, 'Year-end infrastructure push');

-- 5. Insert Live AIS Fleet Telemetry & Shipments
INSERT OR REPLACE INTO shipments (id, commodity, quantity_mt, origin_port, destination_port, vessel_name, vessel_class, speed_knots, course_degrees, transit_corridor, arrival_date, freight_rate_usd, status) VALUES
('SHP-001', 'Iron Ore (Fines)', 74500, 'Port Hedland', 'Paradip Port', 'MV Blue Horizon', 'Panamax', 13.2, 318, 'Lombok Strait -> Six Degree Channel', '18 Mar 2026', 25.4, 'Laden'),
('SHP-002', 'Coking Coal', 165000, 'Port Hedland', 'Visakhapatnam (Outer)', 'MV Iron Leader', 'Capesize', 12.6, 325, 'Deep Water Sunda Trench Corridor', '25 Feb 2026', 22.8, 'En Route'),
('SHP-003', 'Thermal Coal', 80000, 'Newcastle', 'Dhamra Port', 'MV Global Pioneer', 'Panamax', 13.0, 310, 'Sunda Strait Transit', '22 Jan 2026', 27.1, 'Sunda Transit'),
('SHP-004', 'Bauxite Ore', 52000, 'Richards Bay', 'Gangavaram', 'MV Queen Mary', 'Supramax', 13.5, 45, 'Indian Ocean Direct', '12 Apr 2026', 31.5, 'Planned'),
('SHP-005', 'Coking Coal', 75000, 'Dalrymple Bay', 'Haldia Dock', 'MV Eastern Harmony', 'Handysize', 13.8, 340, 'Malacca -> Sandheads River Pilot', '05 May 2026', 36.2, 'Planned');

-- 6. Insert Decision Briefs
INSERT OR REPLACE INTO decision_briefs (id, title, simulation_id, route_description, optimal_vessel_name, cargo_quantity_mt, freight_rate_per_ton, total_cost_usd, risk_level, key_findings, mopsw_benchmark_compliance, status) VALUES
('BRF-2026-001', 'Paradip Iron Ore Charter Optimization Brief', 'SIM-DEFAULT', 'Port Hedland to Paradip Port', 'MV Blue Horizon (Panamax 76k DWT)', 150000, 25.40, 3810000, 'Low', 'Panamax represents the lowest risk-adjusted cost per ton ($25.40/MT). Capesize exceeds Paradip max draft (14.5m limit requires lighterage at Sandheads).', 'Meets MoPSW turnaround benchmark target (48.2 hrs). Draft clearance +0.32m verified.', 'Approved'),
('BRF-2026-002', 'Q1 East Coast Rate Forecast Summary', 'SIM-DEFAULT', 'All Major Corridors to India East Coast', 'Capesize & Panamax Fleet', 350000, 24.80, 8680000, 'Medium', 'Freight rates projected to trade in $22-28/t range. Bunker price volatility remains the primary cost delta driver (+$1.80/t per $50/MT bunker spike).', 'Port trust berths operating at normal capacity. Congestion index: Normal.', 'Approved'),
('BRF-2026-003', 'MoPSW Port Turnaround & Congestion Audit', 'SIM-DEFAULT', 'Major Ports (Paradip, Vizag, Dhamra, Haldia)', 'All Classes', 0, 0, 0, 'Low', 'Average turnaround across East Coast major ports FY25 stands at 49.5 hours. Dhamra leads with 36.8 hrs; Haldia constrained by river draft at 64.2 hrs.', 'Authoritative port trust constraints active. Pre-berthing waiting minimized.', 'Approved');

-- 7. Insert Live Market Feeds
INSERT OR REPLACE INTO market_feeds (feed_key, name, value, unit, source, last_updated) VALUES
('bunker_vlsfo_sg', 'Bunker Fuel (VLSFO Singapore)', 624.0, 'USD / MT', 'Platts / Singapore Bunkering Terminal', datetime('now')),
('bdi_index', 'Baltic Dry Index (BDI)', 1640.0, 'Points', 'Baltic Exchange London', datetime('now')),
('bci_capesize', 'Baltic Capesize Index (C5 West Australia -> China/India)', 22.50, 'USD / MT', 'Baltic Exchange C5 Route', datetime('now')),
('bpi_panamax', 'Baltic Panamax Index (P3A Pacific Round)', 17200.0, 'USD / Day', 'Baltic Exchange P3A Route', datetime('now')),
('mopsw_avg_turnaround', 'MoPSW Major Ports Average Turnaround', 49.5, 'Hours', 'Ministry of Ports, Shipping and Waterways (MoPSW)', datetime('now'));

-- 8. Insert Default Simulation
INSERT OR REPLACE INTO simulations (id, name, origin_port_id, dest_port_id, commodity_id, cargo_quantity_mt, target_arrival_date, horizon_days, bunker_price_per_mt, port_congestion_days, market_volatility_shock, recommended_vessel_id, optimal_cost_per_ton, total_cost_usd, status) VALUES
('SIM-DEFAULT', 'Paradip Iron Ore Benchmark Procurement', 'port_hedland', 'paradip', 'iron_ore', 150000, '18 Mar 2026', 60, 624, 1.5, 0, 'vessel_1', 25.40, 3810000, 'Active');
