import sqlite3
import os
import random
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'fleet.db')

def enrich_seeds():
    print(f"Enriching SQLite Database with Seeds at: {DB_PATH}")
    start_time = time.time()
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    random.seed(42) # Deterministic high quality seed generation

    # 1. fact_telemetry_iot
    print("Seeding fact_telemetry_iot (IoT Sensors)...")
    cursor.execute("DROP TABLE IF EXISTS fact_telemetry_iot;")
    cursor.execute("""
        CREATE TABLE fact_telemetry_iot (
            vehicle_id TEXT PRIMARY KEY,
            engine_temp_c REAL,
            tire_pressure_psi REAL,
            fuel_battery_pct REAL,
            harsh_braking_events INTEGER,
            speeding_events INTEGER,
            telemetry_status TEXT
        );
    """)

    vehicles = [r[0] for r in cursor.execute("SELECT vehicle_id FROM dim_vehicle").fetchall()]
    iot_rows = []
    for v in vehicles:
        temp = round(random.uniform(78.0, 108.0), 1)
        pressure = round(random.uniform(90.0, 115.0), 1)
        pct = round(random.uniform(15.0, 98.0), 1)
        braking = random.randint(0, 8)
        speeding = random.randint(0, 5)
        status = 'Normal'
        if temp > 102.0:
            status = 'Surchauffe Moteur'
        elif pressure < 95.0:
            status = 'Pression Pneus Basse'
        elif pct < 20.0:
            status = 'Niveau Bas'
        
        iot_rows.append((v, temp, pressure, pct, braking, speeding, status))

    cursor.executemany("INSERT INTO fact_telemetry_iot VALUES (?,?,?,?,?,?,?)", iot_rows)

    # 2. dim_driver_ecodriving
    print("Seeding dim_driver_ecodriving (RSE & Eco-Driving)...")
    cursor.execute("DROP TABLE IF EXISTS dim_driver_ecodriving;")
    cursor.execute("""
        CREATE TABLE dim_driver_ecodriving (
            driver_id TEXT PRIMARY KEY,
            eco_score REAL,
            driving_hours_week REAL,
            rest_compliance_pct REAL,
            smooth_acceleration_pct REAL
        );
    """)

    drivers = [r[0] for r in cursor.execute("SELECT driver_id FROM dim_driver").fetchall()]
    eco_rows = []
    for d in drivers:
        eco = round(random.uniform(65.0, 99.0), 1)
        hours = round(random.uniform(32.0, 48.0), 1)
        rest = round(random.uniform(88.0, 100.0), 1)
        smooth = round(random.uniform(70.0, 98.0), 1)
        eco_rows.append((d, eco, hours, rest, smooth))

    cursor.executemany("INSERT INTO dim_driver_ecodriving VALUES (?,?,?,?,?)", eco_rows)

    # 3. fact_vehicle_wear_rul
    print("Seeding fact_vehicle_wear_rul (Wear & RUL)...")
    cursor.execute("DROP TABLE IF EXISTS fact_vehicle_wear_rul;")
    cursor.execute("""
        CREATE TABLE fact_vehicle_wear_rul (
            vehicle_id TEXT PRIMARY KEY,
            brake_wear_pct REAL,
            tire_wear_pct REAL,
            oil_life_pct REAL,
            remaining_useful_life_km INTEGER,
            wear_alert TEXT
        );
    """)

    wear_rows = []
    for v in vehicles:
        brake = round(random.uniform(15.0, 95.0), 1)
        tire = round(random.uniform(20.0, 92.0), 1)
        oil = round(random.uniform(10.0, 98.0), 1)
        rul = random.randint(5000, 180000)
        alert = 'OK'
        if brake > 85.0:
            alert = 'Remplacement Freins Requis'
        elif tire > 85.0:
            alert = 'Changement Pneumatiques Requis'
        elif oil < 20.0:
            alert = 'Vidange Moteur Immédiate'
            
        wear_rows.append((v, brake, tire, oil, rul, alert))

    cursor.executemany("INSERT INTO fact_vehicle_wear_rul VALUES (?,?,?,?,?,?)", wear_rows)

    # 4. dim_route_weather
    print("Seeding dim_route_weather (Weather & Congestion)...")
    cursor.execute("DROP TABLE IF EXISTS dim_route_weather;")
    cursor.execute("""
        CREATE TABLE dim_route_weather (
            route_id TEXT PRIMARY KEY,
            weather_condition TEXT,
            traffic_congestion TEXT,
            avg_delay_minutes INTEGER
        );
    """)

    routes = [r[0] for r in cursor.execute("SELECT route_id FROM dim_route").fetchall()]
    weathers = ['Ensoleillé ☀️', 'Pluie Forte 🌧️', 'Neige / Verglas ❄️', 'Brouillard 🌫️']
    traffics = ['Fluide', 'Modéré', 'Dense', 'Saturé / Bouchons']
    
    weather_rows = []
    for r in routes:
        w = random.choice(weathers)
        tr = random.choice(traffics)
        delay = random.randint(0, 45) if tr != 'Fluide' else 0
        weather_rows.append((r, w, tr, delay))

    cursor.executemany("INSERT INTO dim_route_weather VALUES (?,?,?,?)", weather_rows)

    # 5. dim_budget_targets
    print("Seeding dim_budget_targets (Executive Targets)...")
    cursor.execute("DROP TABLE IF EXISTS dim_budget_targets;")
    cursor.execute("""
        CREATE TABLE dim_budget_targets (
            year INTEGER,
            month INTEGER,
            target_revenue REAL,
            target_margin REAL,
            target_on_time_pct REAL,
            PRIMARY KEY (year, month)
        );
    """)

    target_rows = []
    for y in [2024, 2025, 2026]:
        for m in range(1, 13):
            # Targets roughly equal to baseline + 5%
            target_rev = 10500000.0
            target_marg = 2000000.0
            target_rows.append((y, m, target_rev, target_marg, 92.5))

    cursor.executemany("INSERT INTO dim_budget_targets VALUES (?,?,?,?,?)", target_rows)

    conn.commit()
    conn.close()
    print(f"Seed enrichment completed successfully in {time.time() - start_time:.2f} seconds!")

if __name__ == '__main__':
    enrich_seeds()
