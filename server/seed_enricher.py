import sqlite3
import os
import random
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'fleet.db')

def enrich_seeds():
    print(f"Enriching SQLite Database with Hyper-Realistic Seeds at: {DB_PATH}")
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
    
    alerts_pool = [
        "CRITIQUE: Surchauffe Liquide Moteur (114°C)",
        "ALERTE: Sous-Pression Pneu Essieu Moteur (76 PSI)",
        "URGENT: Colmatage Filtre DPF/FAP (SPN 3251)",
        "CRITIQUE: Chute Pression Huile Moteur (1.2 bar)",
        "ALERTE: Niveau AdBlue Seuil Réservoir (4.5%)",
        "ATTENTION: Sous-Pression Turbocompresseur (P0299)",
        "AVERTISSEMENT: Pression Injection Rail (P0087)",
        "ALERTE: Tension Batterie Sous Seuil (21.4V)",
        "ATTENTION: Ralenti Excessif & Surconsommation",
        "ALERTE: Défaut Thermostat Moteur (P0128)",
        "AVERTISSEMENT: Surchauffe Freins Disque EBS",
        "CRITIQUE: Fuite Carburant Détectée"
    ]

    for v in vehicles:
        # Base healthy values
        temp = round(random.uniform(82.0, 95.0), 1)
        pressure = round(random.uniform(105.0, 115.0), 1)
        pct = round(random.uniform(30.0, 98.0), 1)
        braking = random.randint(0, 3)
        speeding = random.randint(0, 2)
        status = 'Normal'
        
        # Introduce anomalies (15% chance of anomaly)
        if random.random() < 0.15:
            anomaly_type = random.choice(['temp', 'pressure', 'fuel', 'dtc'])
            if anomaly_type == 'temp':
                temp = round(random.uniform(104.0, 118.0), 1)
                status = "CRITIQUE: Surchauffe Liquide Moteur"
            elif anomaly_type == 'pressure':
                pressure = round(random.uniform(72.0, 89.0), 1)
                status = "ALERTE: Sous-Pression Pneu Essieu Moteur"
            elif anomaly_type == 'fuel':
                pct = round(random.uniform(5.0, 18.0), 1)
                status = "ALERTE: Niveau Carburant/Batterie Critique"
            else:
                status = random.choice(alerts_pool)
                # Ensure values match status context somewhat
                if "114°C" in status: temp = 114.2
                if "76 PSI" in status: pressure = 76.5
                if "4.5%" in status: pct = 4.5
        
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
        # Realistic distributions: mostly good, some bad
        if random.random() > 0.15:
            eco = round(random.uniform(85.0, 99.0), 1)
            hours = round(random.uniform(35.0, 48.0), 1)
            rest = round(random.uniform(95.0, 100.0), 1)
            smooth = round(random.uniform(80.0, 98.0), 1)
        else:
            eco = round(random.uniform(65.0, 84.0), 1)
            hours = round(random.uniform(48.0, 56.0), 1) # Over hours
            rest = round(random.uniform(75.0, 94.0), 1)
            smooth = round(random.uniform(55.0, 79.0), 1)
            
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

    wear_alerts_pool = [
        "URGENT: Remplacement Disques & Plaquettes (Usure 94%)",
        "ALERTE: Changement Pneumatiques Essieu Directeurs (Usure 91%)",
        "PLANIFIÉ: Vidange Synthétique Moteur 5W30 & Filtre à Huile",
        "RECOMMANDÉ: Purge Air Freinage & Dessiccateur EBS",
        "URGENT: Nettoyage Chimique FAP & Sonde NOx",
        "PLANIFIÉ: Vidange Boîte Optidriver / I-Shift",
        "ALERTE: Remplacement Courroie Accessoires & Alternateur",
        "ATTENTION: Contrôle Amortisseurs & Suspensions Pneumatiques"
    ]

    wear_rows = []
    for v in vehicles:
        brake = round(random.uniform(15.0, 95.0), 1)
        tire = round(random.uniform(20.0, 92.0), 1)
        oil = round(random.uniform(5.0, 98.0), 1)
        rul = random.randint(5000, 180000)
        
        alert = 'OK - Usure Conforme'
        if brake > 85.0 or tire > 85.0 or oil < 15.0:
             alert = random.choice(wear_alerts_pool)
             
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
    weathers = [
        'Soleil & Chaussée Sèche ☀️', 
        'Pluie Diluvienne 🌧️', 
        'Neige & Verglas (Passage Alpin) ❄️', 
        'Brouillard Nocturne Épais 🌫️', 
        'Rafales de Vent (>85 km/h) 💨'
    ]
    traffics = [
        'Fluide (Chrono 100%)', 
        'Travaux A6 Lyon (+15 min)', 
        'Embouteillage Péage / Nœud Routier (+35 min)', 
        'Accident A7 Vallée du Rhône (+55 min)', 
        'Passage Douanier / Contrôle (+40 min)'
    ]
    
    weather_rows = []
    for r in routes:
        w = random.choice(weathers)
        # Weight towards fluid traffic
        if random.random() > 0.3:
            tr = 'Fluide (Chrono 100%)'
            delay = 0
        else:
            tr = random.choice([t for t in traffics if t != 'Fluide (Chrono 100%)'])
            delay = int(tr.split('+')[1].split(' ')[0]) if '+' in tr else random.randint(15, 60)
            
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
            target_rev = 10500000.0
            target_marg = 2000000.0
            target_rows.append((y, m, target_rev, target_marg, 92.5))

    cursor.executemany("INSERT INTO dim_budget_targets VALUES (?,?,?,?,?)", target_rows)

    conn.commit()
    conn.close()
    
    # We also need to add tenant_id columns back since we DROPPED and RECREATED tables!
    try:
        from migrations import add_tenant_columns
        add_tenant_columns(['fact_telemetry_iot', 'dim_driver_ecodriving', 'fact_vehicle_wear_rul', 'dim_route_weather', 'dim_budget_targets'])
    except Exception as e:
        print("Could not run migrations.add_tenant_columns: ", e)

    print(f"Seed enrichment completed successfully in {time.time() - start_time:.2f} seconds!")

if __name__ == '__main__':
    enrich_seeds()
