import sqlite3
from config import get_db_path, get_default_tenant


def add_tenant_columns(tables=None):
    db = get_db_path()
    conn = sqlite3.connect(db)
    c = conn.cursor()
    if tables is None:
        tables = [
            'fact_trip', 'fact_maintenance', 'fact_accident',
            'dim_customer', 'dim_vehicle', 'dim_driver', 'dim_route',
            'fact_telemetry_iot', 'dim_driver_ecodriving',
            'fact_vehicle_wear_rul', 'dim_route_weather', 'dim_budget_targets'
        ]
    for t in tables:
        try:
            cols = [r[1] for r in c.execute(f"PRAGMA table_info('{t}')").fetchall()]
            if 'tenant_id' not in cols:
                default = get_default_tenant().replace("'", "''")
                c.execute(f"ALTER TABLE {t} ADD COLUMN tenant_id TEXT DEFAULT '{default}'")
                print(f"Added tenant_id to {t}")
        except Exception as exc:
            print(f"Skipping {t}: {exc}")
    indexes = {
        'fact_trip': ('tenant_id, tractor_id', 'tenant_id, route_id', 'tenant_id, driver_id', 'tenant_id, customer_id', 'tenant_id, date'),
        'fact_maintenance': ('tenant_id, vehicle_id', 'tenant_id, date'),
        'fact_accident': ('tenant_id, driver_id', 'tenant_id, vehicle_id'),
        'dim_vehicle': ('tenant_id, vehicle_id',),
        'dim_driver': ('tenant_id, driver_id',),
        'dim_route': ('tenant_id, route_id',),
    }
    for table, columns_list in indexes.items():
        for columns in columns_list:
            index_name = f"idx_{table}_{columns.replace(', ', '_')}"
            try:
                c.execute(f'CREATE INDEX IF NOT EXISTS {index_name} ON {table} ({columns})')
            except Exception as exc:
                print(f"Skipping index {index_name}: {exc}")
    conn.commit()
    conn.close()


if __name__ == '__main__':
    add_tenant_columns()
