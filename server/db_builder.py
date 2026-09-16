import csv
import sqlite3
import os
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(BASE_DIR)
DB_PATH = os.path.join(BASE_DIR, 'fleet.db')

def build_db():
    print(f"Building SQLite Database at: {DB_PATH}")
    start_time = time.time()
    
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Enable WAL mode and pragmas for high speed
    cursor.execute("PRAGMA journal_mode = WAL;")
    cursor.execute("PRAGMA synchronous = NORMAL;")
    
    # 1. dim_calendar
    print("Loading dim_calendar...")
    cursor.execute("""
        CREATE TABLE dim_calendar (
            date TEXT PRIMARY KEY,
            year INTEGER,
            month INTEGER,
            quarter INTEGER,
            day_of_week INTEGER,
            is_weekend INTEGER,
            is_holiday INTEGER
        );
    """)
    with open(os.path.join(DATA_DIR, 'dim_calendar.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        cursor.executemany("""
            INSERT INTO dim_calendar VALUES (?,?,?,?,?,?,?)
        """, [(r['date'], int(r['year']), int(r['month']), int(r['quarter']),
               int(r['day_of_week']), int(r['is_weekend']), int(r['is_holiday'])) for r in reader])
        
    # 2. dim_customer
    print("Loading dim_customer...")
    cursor.execute("""
        CREATE TABLE dim_customer (
            customer_id TEXT PRIMARY KEY,
            customer_name TEXT,
            industry TEXT,
            country TEXT,
            contract_type TEXT
        );
    """)
    with open(os.path.join(DATA_DIR, 'dim_customer.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        cursor.executemany("""
            INSERT INTO dim_customer VALUES (?,?,?,?,?)
        """, [(r['customer_id'], r['customer_name'], r['industry'], r['country'], r['contract_type']) for r in reader])

    # 3. dim_driver
    print("Loading dim_driver...")
    cursor.execute("""
        CREATE TABLE dim_driver (
            driver_id TEXT PRIMARY KEY,
            name TEXT,
            age INTEGER,
            nationality TEXT,
            experience_years INTEGER,
            license_type TEXT,
            base_salary REAL,
            safety_score_base REAL
        );
    """)
    with open(os.path.join(DATA_DIR, 'dim_driver.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        cursor.executemany("""
            INSERT INTO dim_driver VALUES (?,?,?,?,?,?,?,?)
        """, [(r['driver_id'], r['name'], int(r['age']), r['nationality'],
               int(r['experience_years']), r['license_type'], float(r['base_salary']), float(r['safety_score_base'])) for r in reader])

    # 4. dim_route
    print("Loading dim_route...")
    cursor.execute("""
        CREATE TABLE dim_route (
            route_id TEXT PRIMARY KEY,
            origin TEXT,
            destination TEXT,
            origin_country TEXT,
            destination_country TEXT,
            international_flag INTEGER,
            distance_km REAL,
            estimated_hours REAL,
            toll_estimate REAL
        );
    """)
    with open(os.path.join(DATA_DIR, 'dim_route.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        cursor.executemany("""
            INSERT INTO dim_route VALUES (?,?,?,?,?,?,?,?,?)
        """, [(r['route_id'], r['origin'], r['destination'], r['origin_country'],
               r['destination_country'], int(r['international_flag']), float(r['distance_km']),
               float(r['estimated_hours']), float(r['toll_estimate'])) for r in reader])

    # 5. dim_vehicle
    print("Loading dim_vehicle...")
    cursor.execute("""
        CREATE TABLE dim_vehicle (
            vehicle_id TEXT PRIMARY KEY,
            registration TEXT,
            vin TEXT,
            vehicle_class TEXT,
            vehicle_type TEXT,
            brand TEXT,
            model_year INTEGER,
            acquisition_cost REAL,
            initial_mileage REAL,
            base_consumption REAL,
            fuel_type TEXT,
            status TEXT
        );
    """)
    with open(os.path.join(DATA_DIR, 'dim_vehicle.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        cursor.executemany("""
            INSERT INTO dim_vehicle VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        """, [(r['vehicle_id'], r['registration'], r['vin'], r['vehicle_class'],
               r['vehicle_type'], r['brand'], int(r['model_year']), float(r['acquisition_cost']),
               float(r['initial_mileage']), float(r['base_consumption']), r['fuel_type'], r['status']) for r in reader])

    # 6. fact_accident
    print("Loading fact_accident...")
    cursor.execute("""
        CREATE TABLE fact_accident (
            accident_id TEXT PRIMARY KEY,
            date TEXT,
            driver_id TEXT,
            vehicle_id TEXT,
            severity TEXT,
            damage_cost REAL,
            driver_fault INTEGER
        );
    """)
    with open(os.path.join(DATA_DIR, 'fact_accident.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        cursor.executemany("""
            INSERT INTO fact_accident VALUES (?,?,?,?,?,?,?)
        """, [(r['accident_id'], r['date'], r['driver_id'], r['vehicle_id'],
               r['severity'], float(r['damage_cost']), int(r['driver_fault'])) for r in reader])

    # 7. fact_maintenance
    print("Loading fact_maintenance...")
    cursor.execute("""
        CREATE TABLE fact_maintenance (
            maintenance_id TEXT PRIMARY KEY,
            vehicle_id TEXT,
            date TEXT,
            maintenance_type TEXT,
            total_cost REAL,
            downtime_hours REAL
        );
    """)
    with open(os.path.join(DATA_DIR, 'fact_maintenance.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        cursor.executemany("""
            INSERT INTO fact_maintenance VALUES (?,?,?,?,?,?)
        """, [(r['maintenance_id'], r['vehicle_id'], r['date'], r['maintenance_type'],
               float(r['total_cost']), float(r['downtime_hours'])) for r in reader])

    # 8. fact_trip (306,600 rows)
    print("Loading fact_trip (306,600 rows)...")
    cursor.execute("""
        CREATE TABLE fact_trip (
            trip_id TEXT PRIMARY KEY,
            date TEXT,
            route_id TEXT,
            tractor_id TEXT,
            trailer_id TEXT,
            driver_id TEXT,
            customer_id TEXT,
            planned_distance_km REAL,
            actual_distance_km REAL,
            loaded_km REAL,
            empty_km REAL,
            fuel_liters REAL,
            fuel_cost REAL,
            toll_cost REAL,
            driver_cost REAL,
            trip_cost REAL,
            revenue REAL,
            margin REAL,
            anomaly_flag INTEGER,
            on_time_flag INTEGER
        );
    """)
    with open(os.path.join(DATA_DIR, 'fact_trip.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = [(r['trip_id'], r['date'], r['route_id'], r['tractor_id'], r['trailer_id'],
                 r['driver_id'], r['customer_id'], float(r['planned_distance_km']),
                 float(r['actual_distance_km']), float(r['loaded_km']), float(r['empty_km']),
                 float(r['fuel_liters']), float(r['fuel_cost']), float(r['toll_cost']),
                 float(r['driver_cost']), float(r['trip_cost']), float(r['revenue']),
                 float(r['margin']), int(r['anomaly_flag']), int(r['on_time_flag'])) for r in reader]
        cursor.executemany("""
            INSERT INTO fact_trip VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, rows)

    # Indexes
    print("Creating Indexes for maximum query performance...")
    cursor.execute("CREATE INDEX idx_ft_date ON fact_trip(date);")
    cursor.execute("CREATE INDEX idx_ft_tractor ON fact_trip(tractor_id);")
    cursor.execute("CREATE INDEX idx_ft_driver ON fact_trip(driver_id);")
    cursor.execute("CREATE INDEX idx_ft_route ON fact_trip(route_id);")
    cursor.execute("CREATE INDEX idx_ft_customer ON fact_trip(customer_id);")
    cursor.execute("CREATE INDEX idx_ft_anomaly ON fact_trip(anomaly_flag);")
    cursor.execute("CREATE INDEX idx_fm_date ON fact_maintenance(date);")
    cursor.execute("CREATE INDEX idx_fm_vehicle ON fact_maintenance(vehicle_id);")
    cursor.execute("CREATE INDEX idx_fa_date ON fact_accident(date);")
    cursor.execute("CREATE INDEX idx_fa_driver ON fact_accident(driver_id);")

    conn.commit()
    conn.close()
    print(f"Database build completed in {time.time() - start_time:.2f} seconds!")

if __name__ == '__main__':
    build_db()
