import http.server
import socketserver
import sqlite3
import json
import os
import urllib.parse
import re

PORT = 8085
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'fleet.db')

# In-Memory Cache Dict for 0ms Latency
RESPONSE_CACHE = {}

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

class FleetAPIHandler(http.server.BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def parse_params(self, parsed_path):
        query = urllib.parse.parse_qs(parsed_path.query)
        params = {}
        for k, v in query.items():
            params[k] = v[0] if len(v) == 1 else v
        return params

    def build_where_clause(self, params, trip_prefix='ft.', maint_prefix='fm.', acc_prefix='fa.'):
        where_trips = []
        where_maint = []
        where_acc = []
        sql_params_trips = []
        sql_params_maint = []
        sql_params_acc = []

        if params.get('year'):
            where_trips.append(f"STRFTIME('%Y', {trip_prefix}date) = ?")
            sql_params_trips.append(str(params['year']))
            where_maint.append(f"STRFTIME('%Y', {maint_prefix}date) = ?")
            sql_params_maint.append(str(params['year']))
            where_acc.append(f"STRFTIME('%Y', {acc_prefix}date) = ?")
            sql_params_acc.append(str(params['year']))

        if params.get('brand'):
            where_trips.append("v.brand = ?")
            sql_params_trips.append(params['brand'])
            where_maint.append("v.brand = ?")
            sql_params_maint.append(params['brand'])

        if params.get('fuel_type'):
            where_trips.append("v.fuel_type = ?")
            sql_params_trips.append(params['fuel_type'])
            where_maint.append("v.fuel_type = ?")
            sql_params_maint.append(params['fuel_type'])

        if params.get('vehicle_class'):
            where_trips.append("v.vehicle_class = ?")
            sql_params_trips.append(params['vehicle_class'])

        if params.get('anomaly') == '1':
            where_trips.append(f"{trip_prefix}anomaly_flag = 1")

        str_trips = (" WHERE " + " AND ".join(where_trips)) if where_trips else ""
        str_maint = (" WHERE " + " AND ".join(where_maint)) if where_maint else ""
        str_acc = (" WHERE " + " AND ".join(where_acc)) if where_acc else ""

        return {
            'trips_where': str_trips, 'trips_params': sql_params_trips,
            'maint_where': str_maint, 'maint_params': sql_params_maint,
            'acc_where': str_acc, 'acc_params': sql_params_acc
        }

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        params = self.parse_params(parsed)

        # Cache Key for instant lookup
        cache_key = f"{path}?{urllib.parse.urlencode(params)}"
        if cache_key in RESPONSE_CACHE:
            self._set_headers(200)
            self.wfile.write(RESPONSE_CACHE[cache_key])
            return

        try:
            if path == '/api/filter_options':
                self.handle_filter_options(cache_key)
            elif path == '/api/summary':
                self.handle_summary(params, cache_key)
            elif path == '/api/analytics/trends':
                self.handle_trends(params, cache_key)
            elif path == '/api/analytics/vehicles':
                self.handle_vehicles(params, cache_key)
            elif path == '/api/analytics/drivers':
                self.handle_drivers(params, cache_key)
            elif path == '/api/analytics/routes':
                self.handle_routes(params, cache_key)
            elif path == '/api/analytics/maintenance':
                self.handle_maintenance(params, cache_key)
            elif path == '/api/analytics/safety':
                self.handle_safety(params, cache_key)
            elif path == '/api/analytics/predictive':
                self.handle_predictive(params, cache_key)
            elif path == '/api/analytics/telemetry_iot':
                self.handle_telemetry_iot(params, cache_key)
            elif path == '/api/analytics/ecodriving':
                self.handle_ecodriving(params, cache_key)
            elif path == '/api/analytics/warehouse_rul':
                self.handle_warehouse_rul(params, cache_key)
            elif path == '/api/analytics/targets':
                self.handle_targets(params, cache_key)
            elif path == '/api/trip_detail':
                self.handle_trip_detail(params)
            elif path == '/api/trips':
                self.handle_trips(params)
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({'error': 'Not found'}).encode('utf-8'))
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/simulate':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            payload = json.loads(body.decode('utf-8'))
            self.handle_simulation(payload)
        elif parsed.path == '/api/ai/query':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            payload = json.loads(body.decode('utf-8'))
            self.handle_ai_query(payload)
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({'error': 'Not found'}).encode('utf-8'))

    def handle_filter_options(self, cache_key):
        conn = get_db()
        c = conn.cursor()
        years = [row[0] for row in c.execute("SELECT DISTINCT year FROM dim_calendar ORDER BY year").fetchall()]
        brands = [row[0] for row in c.execute("SELECT DISTINCT brand FROM dim_vehicle ORDER BY brand").fetchall()]
        fuel_types = [row[0] for row in c.execute("SELECT DISTINCT fuel_type FROM dim_vehicle ORDER BY fuel_type").fetchall()]
        vehicle_classes = [row[0] for row in c.execute("SELECT DISTINCT vehicle_class FROM dim_vehicle ORDER BY vehicle_class").fetchall()]
        countries = [row[0] for row in c.execute("SELECT DISTINCT country FROM dim_customer ORDER BY country").fetchall()]
        conn.close()

        res_bytes = json.dumps({
            'years': years, 'brands': brands, 'fuel_types': fuel_types,
            'vehicle_classes': vehicle_classes, 'countries': countries
        }).encode('utf-8')
        RESPONSE_CACHE[cache_key] = res_bytes
        self._set_headers(200)
        self.wfile.write(res_bytes)

    def handle_summary(self, params, cache_key):
        conn = get_db()
        c = conn.cursor()
        w = self.build_where_clause(params)

        row_trip = c.execute(f"""
            SELECT 
                COUNT(*) as total_trips,
                COALESCE(SUM(revenue), 0) as total_revenue,
                COALESCE(SUM(margin), 0) as total_margin,
                COALESCE(SUM(fuel_cost), 0) as total_fuel_cost,
                COALESCE(SUM(trip_cost), 0) as total_trip_cost,
                COALESCE(SUM(actual_distance_km), 0) as total_distance_km,
                COALESCE(SUM(loaded_km), 0) as total_loaded_km,
                COALESCE(SUM(empty_km), 0) as total_empty_km,
                COALESCE(SUM(fuel_liters), 0) as total_fuel_liters,
                COALESCE(AVG(on_time_flag), 0) * 100 as on_time_rate,
                COALESCE(AVG(anomaly_flag), 0) * 100 as anomaly_rate
            FROM fact_trip ft
            JOIN dim_vehicle v ON ft.tractor_id = v.vehicle_id
            {w['trips_where']}
        """, w['trips_params']).fetchone()

        row_maint = c.execute(f"""
            SELECT 
                COUNT(*) as maint_count,
                COALESCE(SUM(total_cost), 0) as total_maint_cost,
                COALESCE(SUM(downtime_hours), 0) as total_downtime_hours
            FROM fact_maintenance fm
            JOIN dim_vehicle v ON fm.vehicle_id = v.vehicle_id
            {w['maint_where']}
        """, w['maint_params']).fetchone()

        row_acc = c.execute(f"""
            SELECT 
                COUNT(*) as accident_count,
                COALESCE(SUM(damage_cost), 0) as total_damage_cost,
                COALESCE(AVG(driver_fault), 0) * 100 as fault_rate
            FROM fact_accident fa
            {w['acc_where']}
        """, w['acc_params']).fetchone()

        conn.close()

        rev = float(row_trip['total_revenue'])
        margin = float(row_trip['total_margin'])
        dist = float(row_trip['total_distance_km'])
        liters = float(row_trip['total_fuel_liters'])
        empty_km = float(row_trip['total_empty_km'])

        res = {
            'total_trips': int(row_trip['total_trips']),
            'total_revenue': round(rev, 2),
            'total_margin': round(margin, 2),
            'margin_rate': round((margin / rev * 100) if rev > 0 else 0, 2),
            'total_fuel_cost': round(float(row_trip['total_fuel_cost']), 2),
            'total_trip_cost': round(float(row_trip['total_trip_cost']), 2),
            'total_distance_km': round(dist, 1),
            'avg_fuel_consumption': round((liters / dist * 100) if dist > 0 else 0, 2),
            'deadhead_ratio': round((empty_km / dist * 100) if dist > 0 else 0, 2),
            'on_time_rate': round(float(row_trip['on_time_rate']), 1),
            'anomaly_rate': round(float(row_trip['anomaly_rate']), 2),
            'maintenance': {
                'count': int(row_maint['maint_count']),
                'total_cost': round(float(row_maint['total_maint_cost']), 2),
                'total_downtime_hours': round(float(row_maint['total_downtime_hours']), 1)
            },
            'accidents': {
                'count': int(row_acc['accident_count']),
                'total_damage_cost': round(float(row_acc['total_damage_cost']), 2),
                'fault_rate': round(float(row_acc['fault_rate']), 1)
            }
        }
        res_bytes = json.dumps(res).encode('utf-8')
        RESPONSE_CACHE[cache_key] = res_bytes
        self._set_headers(200)
        self.wfile.write(res_bytes)

    def handle_trends(self, params, cache_key):
        conn = get_db()
        c = conn.cursor()
        w = self.build_where_clause(params)

        rows = c.execute(f"""
            SELECT 
                STRFTIME('%Y-%m', ft.date) as month,
                COUNT(*) as trips,
                SUM(ft.revenue) as revenue,
                SUM(ft.margin) as margin,
                SUM(ft.fuel_cost) as fuel_cost,
                SUM(ft.trip_cost) as trip_cost,
                AVG(ft.on_time_flag) * 100 as on_time_rate
            FROM fact_trip ft
            JOIN dim_vehicle v ON ft.tractor_id = v.vehicle_id
            {w['trips_where']}
            GROUP BY month
            ORDER BY month ASC
        """, w['trips_params']).fetchall()

        maint_map = {r['month']: (r['maint_cost'] or 0, r['downtime_hours'] or 0) for r in c.execute(f"""
            SELECT 
                STRFTIME('%Y-%m', fm.date) as month,
                SUM(fm.total_cost) as maint_cost,
                SUM(fm.downtime_hours) as downtime_hours
            FROM fact_maintenance fm
            JOIN dim_vehicle v ON fm.vehicle_id = v.vehicle_id
            {w['maint_where']}
            GROUP BY month
        """, w['maint_params']).fetchall()}

        conn.close()

        trends = []
        for r in rows:
            m = r['month']
            m_cost, d_hours = maint_map.get(m, (0, 0))
            trends.append({
                'month': m,
                'trips': r['trips'],
                'revenue': round(r['revenue'] or 0, 2),
                'margin': round(r['margin'] or 0, 2),
                'fuel_cost': round(r['fuel_cost'] or 0, 2),
                'trip_cost': round(r['trip_cost'] or 0, 2),
                'maint_cost': round(m_cost, 2),
                'downtime_hours': round(d_hours, 1),
                'on_time_rate': round(r['on_time_rate'] or 0, 1)
            })

        res_bytes = json.dumps(trends).encode('utf-8')
        RESPONSE_CACHE[cache_key] = res_bytes
        self._set_headers(200)
        self.wfile.write(res_bytes)

    def handle_vehicles(self, params, cache_key):
        conn = get_db()
        c = conn.cursor()
        w = self.build_where_clause(params)

        brands = []
        for r in c.execute(f"""
            SELECT 
                v.brand,
                COUNT(ft.trip_id) as total_trips,
                SUM(ft.revenue) as revenue,
                SUM(ft.margin) as margin,
                SUM(ft.fuel_cost) as fuel_cost,
                SUM(ft.fuel_liters) as fuel_liters,
                SUM(ft.actual_distance_km) as distance_km
            FROM fact_trip ft
            JOIN dim_vehicle v ON ft.tractor_id = v.vehicle_id
            {w['trips_where']}
            GROUP BY v.brand
            ORDER BY revenue DESC
        """, w['trips_params']).fetchall():
            dist = r['distance_km'] or 0
            liters = r['fuel_liters'] or 0
            brands.append({
                'brand': r['brand'],
                'total_trips': r['total_trips'],
                'revenue': round(r['revenue'] or 0, 2),
                'margin': round(r['margin'] or 0, 2),
                'fuel_cost': round(r['fuel_cost'] or 0, 2),
                'avg_consumption': round((liters / dist * 100) if dist > 0 else 0, 2)
            })

        fuel_types = []
        for r in c.execute(f"""
            SELECT 
                v.fuel_type,
                COUNT(ft.trip_id) as total_trips,
                SUM(ft.revenue) as revenue,
                SUM(ft.margin) as margin,
                SUM(ft.fuel_cost) as fuel_cost,
                SUM(ft.fuel_liters) as fuel_liters,
                SUM(ft.actual_distance_km) as distance_km
            FROM fact_trip ft
            JOIN dim_vehicle v ON ft.tractor_id = v.vehicle_id
            {w['trips_where']}
            GROUP BY v.fuel_type
            ORDER BY revenue DESC
        """, w['trips_params']).fetchall():
            dist = r['distance_km'] or 0
            liters = r['fuel_liters'] or 0
            fuel_types.append({
                'fuel_type': r['fuel_type'],
                'total_trips': r['total_trips'],
                'revenue': round(r['revenue'] or 0, 2),
                'margin': round(r['margin'] or 0, 2),
                'fuel_cost': round(r['fuel_cost'] or 0, 2),
                'avg_consumption': round((liters / dist * 100) if dist > 0 else 0, 2)
            })

        top_vehicles = []
        for r in c.execute("""
            SELECT 
                v.vehicle_id,
                v.registration,
                v.brand,
                v.fuel_type,
                v.acquisition_cost,
                COUNT(ft.trip_id) as total_trips,
                SUM(ft.revenue) as revenue,
                SUM(ft.margin) as margin,
                SUM(ft.actual_distance_km) as distance_km
            FROM dim_vehicle v
            LEFT JOIN fact_trip ft ON v.vehicle_id = ft.tractor_id
            GROUP BY v.vehicle_id
            ORDER BY margin DESC
            LIMIT 10
        """).fetchall():
            top_vehicles.append({
                'vehicle_id': r['vehicle_id'],
                'registration': r['registration'],
                'brand': r['brand'],
                'fuel_type': r['fuel_type'],
                'acquisition_cost': r['acquisition_cost'],
                'trips': r['total_trips'],
                'revenue': round(r['revenue'] or 0, 2),
                'margin': round(r['margin'] or 0, 2),
                'distance_km': round(r['distance_km'] or 0, 1)
            })

        conn.close()
        res_bytes = json.dumps({'brands': brands, 'fuel_types': fuel_types, 'top_vehicles': top_vehicles}).encode('utf-8')
        RESPONSE_CACHE[cache_key] = res_bytes
        self._set_headers(200)
        self.wfile.write(res_bytes)

    def handle_drivers(self, params, cache_key):
        conn = get_db()
        c = conn.cursor()
        # Fix: Use pre-aggregated subqueries to avoid Cartesian product
        # between fact_trip and fact_accident (double LEFT JOIN was making
        # accident_count = trip_count due to row multiplication)
        rows = c.execute("""
            SELECT 
                d.driver_id,
                d.name,
                d.nationality,
                d.experience_years,
                d.safety_score_base,
                COALESCE(t.total_trips, 0)    as total_trips,
                COALESCE(t.total_revenue, 0)   as total_revenue,
                COALESCE(t.total_margin, 0)    as total_margin,
                COALESCE(t.total_distance, 0)  as total_distance,
                COALESCE(a.accident_count, 0)  as accident_count,
                COALESCE(a.damage_cost, 0)     as damage_cost
            FROM dim_driver d
            LEFT JOIN (
                SELECT
                    driver_id,
                    COUNT(trip_id)           as total_trips,
                    SUM(revenue)             as total_revenue,
                    SUM(margin)              as total_margin,
                    SUM(actual_distance_km)  as total_distance
                FROM fact_trip
                GROUP BY driver_id
            ) t ON d.driver_id = t.driver_id
            LEFT JOIN (
                SELECT
                    driver_id,
                    COUNT(accident_id)  as accident_count,
                    SUM(damage_cost)    as damage_cost
                FROM fact_accident
                GROUP BY driver_id
            ) a ON d.driver_id = a.driver_id
            ORDER BY total_margin DESC
            LIMIT 50
        """).fetchall()
        conn.close()

        drivers = []
        for r in rows:
            drivers.append({
                'driver_id': r['driver_id'],
                'name': r['name'],
                'nationality': r['nationality'],
                'experience': r['experience_years'],
                'safety_score': round(r['safety_score_base'], 1),
                'trips': r['total_trips'],
                'revenue': round(r['total_revenue'] or 0, 2),
                'margin': round(r['total_margin'] or 0, 2),
                'distance_km': round(r['total_distance'] or 0, 1),
                'accidents': r['accident_count'],
                'damage_cost': round(r['damage_cost'], 2)
            })

        res_bytes = json.dumps(drivers).encode('utf-8')
        RESPONSE_CACHE[cache_key] = res_bytes
        self._set_headers(200)
        self.wfile.write(res_bytes)

    def handle_routes(self, params, cache_key):
        conn = get_db()
        c = conn.cursor()
        rows = c.execute("""
            SELECT 
                r.route_id,
                r.origin,
                r.destination,
                r.origin_country,
                r.destination_country,
                r.international_flag,
                r.distance_km,
                COUNT(ft.trip_id) as total_trips,
                SUM(ft.revenue) as revenue,
                SUM(ft.margin) as margin,
                AVG(ft.on_time_flag) * 100 as on_time_rate
            FROM dim_route r
            LEFT JOIN fact_trip ft ON r.route_id = ft.route_id
            GROUP BY r.route_id
            ORDER BY margin DESC
            LIMIT 30
        """).fetchall()
        conn.close()

        routes = []
        for r in rows:
            rev = r['revenue'] or 0
            margin = r['margin'] or 0
            routes.append({
                'route_id': r['route_id'],
                'origin': r['origin'],
                'destination': r['destination'],
                'origin_country': r['origin_country'],
                'destination_country': r['destination_country'],
                'is_international': bool(r['international_flag']),
                'distance_km': r['distance_km'],
                'total_trips': r['total_trips'],
                'revenue': round(rev, 2),
                'margin': round(margin, 2),
                'margin_rate': round((margin / rev * 100) if rev > 0 else 0, 1),
                'on_time_rate': round(r['on_time_rate'] or 0, 1)
            })

        res_bytes = json.dumps(routes).encode('utf-8')
        RESPONSE_CACHE[cache_key] = res_bytes
        self._set_headers(200)
        self.wfile.write(res_bytes)

    def handle_maintenance(self, params, cache_key):
        conn = get_db()
        c = conn.cursor()
        w = self.build_where_clause(params)

        types = []
        for r in c.execute(f"""
            SELECT 
                fm.maintenance_type,
                COUNT(*) as event_count,
                SUM(fm.total_cost) as total_cost,
                SUM(fm.downtime_hours) as downtime_hours
            FROM fact_maintenance fm
            JOIN dim_vehicle v ON fm.vehicle_id = v.vehicle_id
            {w['maint_where']}
            GROUP BY fm.maintenance_type
        """, w['maint_params']).fetchall():
            types.append({
                'type': r['maintenance_type'],
                'count': r['event_count'],
                'cost': round(r['total_cost'] or 0, 2),
                'downtime_hours': round(r['downtime_hours'] or 0, 1)
            })

        brands = []
        for r in c.execute(f"""
            SELECT 
                v.brand,
                COUNT(fm.maintenance_id) as event_count,
                SUM(fm.total_cost) as total_cost,
                SUM(fm.downtime_hours) as downtime_hours
            FROM fact_maintenance fm
            JOIN dim_vehicle v ON fm.vehicle_id = v.vehicle_id
            {w['maint_where']}
            GROUP BY v.brand
            ORDER BY total_cost DESC
        """, w['maint_params']).fetchall():
            brands.append({
                'brand': r['brand'],
                'count': r['event_count'],
                'cost': round(r['total_cost'] or 0, 2),
                'downtime_hours': round(r['downtime_hours'] or 0, 1)
            })

        conn.close()
        res_bytes = json.dumps({'by_type': types, 'by_brand': brands}).encode('utf-8')
        RESPONSE_CACHE[cache_key] = res_bytes
        self._set_headers(200)
        self.wfile.write(res_bytes)

    def handle_safety(self, params, cache_key):
        conn = get_db()
        c = conn.cursor()
        severities = []
        for r in c.execute("""
            SELECT 
                severity,
                COUNT(*) as count,
                SUM(damage_cost) as damage_cost,
                AVG(driver_fault) * 100 as fault_rate
            FROM fact_accident
            GROUP BY severity
        """).fetchall():
            severities.append({
                'severity': r['severity'],
                'count': r['count'],
                'damage_cost': round(r['damage_cost'] or 0, 2),
                'fault_rate': round(r['fault_rate'] or 0, 1)
            })

        row_fault = c.execute("SELECT AVG(driver_fault) * 100 as fault_rate, COUNT(*) as total FROM fact_accident").fetchone()
        conn.close()

        res_bytes = json.dumps({
            'severities': severities,
            'overall_fault_rate': round(row_fault['fault_rate'], 1),
            'total_accidents': row_fault['total']
        }).encode('utf-8')
        RESPONSE_CACHE[cache_key] = res_bytes
        self._set_headers(200)
        self.wfile.write(res_bytes)

    def handle_predictive(self, params, cache_key):
        conn = get_db()
        c = conn.cursor()

        high_risk_vehicles = []
        for r in c.execute("""
            SELECT 
                v.vehicle_id,
                v.registration,
                v.brand,
                v.fuel_type,
                v.model_year,
                COALESCE(SUM(fm.downtime_hours), 0) as total_downtime,
                COALESCE(SUM(fm.total_cost), 0) as maint_cost,
                COUNT(ft.trip_id) as total_trips
            FROM dim_vehicle v
            LEFT JOIN fact_maintenance fm ON v.vehicle_id = fm.vehicle_id
            LEFT JOIN fact_trip ft ON v.vehicle_id = ft.tractor_id
            GROUP BY v.vehicle_id
            HAVING total_downtime > 120 OR maint_cost > 65000
            ORDER BY total_downtime DESC
            LIMIT 10
        """).fetchall():
            high_risk_vehicles.append({
                'vehicle_id': r['vehicle_id'],
                'registration': r['registration'],
                'brand': r['brand'],
                'fuel_type': r['fuel_type'],
                'model_year': r['model_year'],
                'downtime_hours': round(r['total_downtime'], 1),
                'maint_cost': round(r['maint_cost'], 2),
                'risk_score': round(min(99, (r['total_downtime'] / 1.5) + (r['maint_cost'] / 1000)), 1)
            })

        co2_rows = c.execute("""
            SELECT 
                v.fuel_type,
                SUM(ft.fuel_liters) as total_liters,
                SUM(ft.actual_distance_km) as total_distance
            FROM fact_trip ft
            JOIN dim_vehicle v ON ft.tractor_id = v.vehicle_id
            GROUP BY v.fuel_type
        """).fetchall()

        co2_data = []
        total_co2_tons = 0.0
        total_saved_tons = 0.0

        for r in co2_rows:
            f = r['fuel_type']
            liters = r['total_liters'] or 0
            dist = r['total_distance'] or 0
            multiplier = 2.68 if f == 'Diesel' else 2.10 if f == 'LNG' else 1.80 if f == 'Hybrid' else 0.15
            co2_tons = (liters * multiplier) / 1000.0
            total_co2_tons += co2_tons
            diesel_eq_tons = (liters * 2.68) / 1000.0
            if f != 'Diesel':
                total_saved_tons += (diesel_eq_tons - co2_tons)

            co2_data.append({
                'fuel_type': f,
                'total_liters': round(liters, 0),
                'total_distance_km': round(dist, 0),
                'co2_tons': round(co2_tons, 1),
                'co2_g_per_km': round((co2_tons * 1e6 / dist) if dist > 0 else 0, 1)
            })

        conn.close()
        res_bytes = json.dumps({
            'high_risk_vehicles': high_risk_vehicles,
            'co2_footprint': {
                'total_co2_tons': round(total_co2_tons, 1),
                'total_saved_tons': round(total_saved_tons, 1),
                'breakdown': co2_data
            }
        }).encode('utf-8')
        RESPONSE_CACHE[cache_key] = res_bytes
        self._set_headers(200)
        self.wfile.write(res_bytes)

    def handle_telemetry_iot(self, params, cache_key):
        conn = get_db()
        c = conn.cursor()
        rows = c.execute("""
            SELECT t.*, v.registration, v.brand, v.fuel_type
            FROM fact_telemetry_iot t
            JOIN dim_vehicle v ON t.vehicle_id = v.vehicle_id
            ORDER BY t.engine_temp_c DESC LIMIT 20
        """).fetchall()
        conn.close()

        sensors = []
        for r in rows:
            sensors.append({
                'vehicle_id': r['vehicle_id'],
                'registration': r['registration'],
                'brand': r['brand'],
                'fuel_type': r['fuel_type'],
                'engine_temp_c': r['engine_temp_c'],
                'tire_pressure_psi': r['tire_pressure_psi'],
                'fuel_battery_pct': r['fuel_battery_pct'],
                'harsh_braking_events': r['harsh_braking_events'],
                'speeding_events': r['speeding_events'],
                'status': r['telemetry_status']
            })

        res_bytes = json.dumps(sensors).encode('utf-8')
        RESPONSE_CACHE[cache_key] = res_bytes
        self._set_headers(200)
        self.wfile.write(res_bytes)

    def handle_ecodriving(self, params, cache_key):
        conn = get_db()
        c = conn.cursor()
        rows = c.execute("""
            SELECT e.*, d.name, d.nationality, d.experience_years
            FROM dim_driver_ecodriving e
            JOIN dim_driver d ON e.driver_id = d.driver_id
            ORDER BY e.eco_score DESC LIMIT 25
        """).fetchall()
        conn.close()

        drivers = []
        for r in rows:
            drivers.append({
                'driver_id': r['driver_id'],
                'name': r['name'],
                'nationality': r['nationality'],
                'experience': r['experience_years'],
                'eco_score': r['eco_score'],
                'driving_hours_week': r['driving_hours_week'],
                'rest_compliance_pct': r['rest_compliance_pct'],
                'smooth_acceleration_pct': r['smooth_acceleration_pct']
            })

        res_bytes = json.dumps(drivers).encode('utf-8')
        RESPONSE_CACHE[cache_key] = res_bytes
        self._set_headers(200)
        self.wfile.write(res_bytes)

    def handle_warehouse_rul(self, params, cache_key):
        conn = get_db()
        c = conn.cursor()
        rows = c.execute("""
            SELECT w.*, v.registration, v.brand
            FROM fact_vehicle_wear_rul w
            JOIN dim_vehicle v ON w.vehicle_id = v.vehicle_id
            WHERE w.wear_alert != 'OK'
            ORDER BY w.brake_wear_pct DESC LIMIT 15
        """).fetchall()
        conn.close()

        wear_items = []
        for r in rows:
            wear_items.append({
                'vehicle_id': r['vehicle_id'],
                'registration': r['registration'],
                'brand': r['brand'],
                'brake_wear_pct': r['brake_wear_pct'],
                'tire_wear_pct': r['tire_wear_pct'],
                'oil_life_pct': r['oil_life_pct'],
                'remaining_useful_life_km': r['remaining_useful_life_km'],
                'wear_alert': r['wear_alert']
            })

        res_bytes = json.dumps(wear_items).encode('utf-8')
        RESPONSE_CACHE[cache_key] = res_bytes
        self._set_headers(200)
        self.wfile.write(res_bytes)

    def handle_targets(self, params, cache_key):
        conn = get_db()
        c = conn.cursor()
        row = c.execute("SELECT SUM(target_revenue) as target_rev, SUM(target_margin) as target_marg FROM dim_budget_targets").fetchone()
        conn.close()

        res_bytes = json.dumps({
            'target_revenue': round(row['target_rev'] or 360000000.0, 2),
            'target_margin': round(row['target_marg'] or 72000000.0, 2),
            'target_on_time_pct': 92.5
        }).encode('utf-8')
        RESPONSE_CACHE[cache_key] = res_bytes
        self._set_headers(200)
        self.wfile.write(res_bytes)

    def handle_trip_detail(self, params):
        trip_id = params.get('id')
        if not trip_id:
            self._set_headers(400)
            self.wfile.write(json.dumps({'error': 'Missing trip id'}).encode('utf-8'))
            return

        conn = get_db()
        c = conn.cursor()

        row = c.execute("""
            SELECT 
                ft.*,
                d.name as driver_name, d.age as driver_age, d.nationality as driver_nat, d.experience_years as driver_exp, d.safety_score_base,
                r.origin, r.destination, r.origin_country, r.destination_country, r.international_flag, r.distance_km as route_dist,
                v.registration as tractor_reg, v.vin as tractor_vin, v.brand as tractor_brand, v.vehicle_type, v.model_year, v.fuel_type, v.base_consumption,
                cust.customer_name, cust.industry as customer_industry, cust.contract_type
            FROM fact_trip ft
            JOIN dim_driver d ON ft.driver_id = d.driver_id
            JOIN dim_route r ON ft.route_id = r.route_id
            JOIN dim_vehicle v ON ft.tractor_id = v.vehicle_id
            JOIN dim_customer cust ON ft.customer_id = cust.customer_id
            WHERE ft.trip_id = ?
        """, (trip_id,)).fetchone()
        
        if not row:
            conn.close()
            self._set_headers(404)
            self.wfile.write(json.dumps({'error': 'Trip not found'}).encode('utf-8'))
            return

        maint_rows = c.execute("""
            SELECT date, maintenance_type, total_cost, downtime_hours 
            FROM fact_maintenance 
            WHERE vehicle_id = ? 
            ORDER BY date DESC LIMIT 5
        """, (row['tractor_id'],)).fetchall()

        conn.close()

        detail = {
            'trip_id': row['trip_id'],
            'date': row['date'],
            'planned_distance_km': row['planned_distance_km'],
            'actual_distance_km': row['actual_distance_km'],
            'loaded_km': row['loaded_km'],
            'empty_km': row['empty_km'],
            'fuel_liters': row['fuel_liters'],
            'fuel_cost': round(row['fuel_cost'], 2),
            'toll_cost': round(row['toll_cost'], 2),
            'driver_cost': round(row['driver_cost'], 2),
            'trip_cost': round(row['trip_cost'], 2),
            'revenue': round(row['revenue'], 2),
            'margin': round(row['margin'], 2),
            'is_on_time': bool(row['on_time_flag']),
            'is_anomaly': bool(row['anomaly_flag']),
            'driver': {
                'id': row['driver_id'],
                'name': row['driver_name'],
                'age': row['driver_age'],
                'nationality': row['driver_nat'],
                'experience': row['driver_exp'],
                'safety_score': round(row['safety_score_base'], 1)
            },
            'route': {
                'id': row['route_id'],
                'origin': row['origin'],
                'destination': row['destination'],
                'origin_country': row['origin_country'],
                'destination_country': row['destination_country'],
                'is_international': bool(row['international_flag']),
                'distance_km': row['route_dist']
            },
            'tractor': {
                'id': row['tractor_id'],
                'registration': row['tractor_reg'],
                'vin': row['tractor_vin'],
                'brand': row['tractor_brand'],
                'model_year': row['model_year'],
                'fuel_type': row['fuel_type'],
                'base_consumption': row['base_consumption']
            },
            'customer': {
                'id': row['customer_id'],
                'name': row['customer_name'],
                'industry': row['customer_industry'],
                'contract_type': row['contract_type']
            },
            'recent_maintenance': [{
                'date': r['date'],
                'type': r['maintenance_type'],
                'cost': round(r['total_cost'], 2),
                'downtime': r['downtime_hours']
            } for r in maint_rows]
        }

        self._set_headers(200)
        self.wfile.write(json.dumps(detail).encode('utf-8'))

    def handle_trips(self, params):
        conn = get_db()
        c = conn.cursor()

        page = int(params.get('page', 1))
        limit = int(params.get('limit', 20))
        offset = (page - 1) * limit
        search = params.get('search', '').strip()

        where_clauses = []
        sql_params = []

        if search:
            where_clauses.append("(ft.trip_id LIKE ? OR d.name LIKE ? OR r.origin LIKE ? OR r.destination LIKE ? OR v.registration LIKE ?)")
            s_param = f"%{search}%"
            sql_params.extend([s_param, s_param, s_param, s_param, s_param])

        if params.get('year'):
            where_clauses.append("STRFTIME('%Y', ft.date) = ?")
            sql_params.append(str(params['year']))

        str_where = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

        total_records = c.execute(f"""
            SELECT COUNT(*) 
            FROM fact_trip ft
            JOIN dim_driver d ON ft.driver_id = d.driver_id
            JOIN dim_route r ON ft.route_id = r.route_id
            JOIN dim_vehicle v ON ft.tractor_id = v.vehicle_id
            {str_where}
        """, sql_params).fetchone()[0]

        rows = c.execute(f"""
            SELECT 
                ft.trip_id,
                ft.date,
                d.name as driver_name,
                r.origin || ' ➔ ' || r.destination as route_name,
                v.registration as tractor_reg,
                ft.actual_distance_km,
                ft.fuel_cost,
                ft.revenue,
                ft.margin,
                ft.on_time_flag,
                ft.anomaly_flag
            FROM fact_trip ft
            JOIN dim_driver d ON ft.driver_id = d.driver_id
            JOIN dim_route r ON ft.route_id = r.route_id
            JOIN dim_vehicle v ON ft.tractor_id = v.vehicle_id
            {str_where}
            ORDER BY ft.date DESC
            LIMIT ? OFFSET ?
        """, sql_params + [limit, offset]).fetchall()
        conn.close()

        trips = []
        for r in rows:
            trips.append({
                'trip_id': r['trip_id'],
                'date': r['date'],
                'driver_name': r['driver_name'],
                'route_name': r['route_name'],
                'tractor_reg': r['tractor_reg'],
                'distance_km': r['actual_distance_km'],
                'fuel_cost': round(r['fuel_cost'], 2),
                'revenue': round(r['revenue'], 2),
                'margin': round(r['margin'], 2),
                'is_on_time': bool(r['on_time_flag']),
                'is_anomaly': bool(r['anomaly_flag'])
            })

        self._set_headers(200)
        self.wfile.write(json.dumps({
            'page': page,
            'limit': limit,
            'total_records': total_records,
            'total_pages': (total_records + limit - 1) // limit,
            'data': trips
        }).encode('utf-8'))

    def handle_simulation(self, payload):
        fuel_pct = float(payload.get('fuel_change_pct', 0)) / 100.0
        wage_pct = float(payload.get('wage_change_pct', 0)) / 100.0
        maint_pct = float(payload.get('maint_change_pct', 0)) / 100.0
        rev_pct = float(payload.get('revenue_change_pct', 0)) / 100.0

        conn = get_db()
        c = conn.cursor()

        row = c.execute("""
            SELECT 
                SUM(revenue) as revenue,
                SUM(margin) as margin,
                SUM(fuel_cost) as fuel_cost,
                SUM(driver_cost) as driver_cost,
                SUM(trip_cost) as trip_cost
            FROM fact_trip
        """).fetchone()

        maint_row = c.execute("SELECT SUM(total_cost) as maint_cost FROM fact_maintenance").fetchone()
        conn.close()

        rev = row['revenue'] or 0
        base_margin = row['margin'] or 0
        base_fuel = row['fuel_cost'] or 0
        base_driver = row['driver_cost'] or 0
        base_maint = maint_row['maint_cost'] or 0

        sim_rev = rev * (1 + rev_pct)
        rev_diff = sim_rev - rev

        sim_fuel = base_fuel * (1 + fuel_pct)
        sim_driver = base_driver * (1 + wage_pct)
        sim_maint = base_maint * (1 + maint_pct)

        fuel_diff = sim_fuel - base_fuel
        driver_diff = sim_driver - base_driver
        maint_diff = sim_maint - base_maint

        sim_margin = base_margin + rev_diff - fuel_diff - driver_diff - maint_diff
        margin_diff = sim_margin - base_margin

        self._set_headers(200)
        self.wfile.write(json.dumps({
            'baseline': {
                'revenue': round(rev, 2),
                'margin': round(base_margin, 2),
                'fuel_cost': round(base_fuel, 2),
                'driver_cost': round(base_driver, 2),
                'maint_cost': round(base_maint, 2),
                'margin_rate': round(base_margin / rev * 100, 2)
            },
            'simulated': {
                'revenue': round(sim_rev, 2),
                'margin': round(sim_margin, 2),
                'fuel_cost': round(sim_fuel, 2),
                'driver_cost': round(sim_driver, 2),
                'maint_cost': round(sim_maint, 2),
                'margin_rate': round(sim_margin / sim_rev * 100, 2) if sim_rev > 0 else 0
            },
            'impact': {
                'margin_change': round(margin_diff, 2),
                'revenue_impact': round(rev_diff, 2),
                'fuel_impact': round(fuel_diff, 2),
                'driver_impact': round(driver_diff, 2),
                'maint_impact': round(maint_diff, 2)
            }
        }).encode('utf-8'))

    def handle_ai_query(self, payload):
        prompt = payload.get('prompt', '').strip().lower()
        conn = get_db()
        c = conn.cursor()

        answer = ""
        sql_used = ""
        results_data = []

        if 'chauffeur' in prompt or 'driver' in prompt or 'securité' in prompt or 'sécurité' in prompt:
            sql_used = """
                SELECT d.name, d.safety_score_base, d.experience_years, COUNT(ft.trip_id) as trips, COUNT(fa.accident_id) as accidents
                FROM dim_driver d
                LEFT JOIN fact_trip ft ON d.driver_id = ft.driver_id
                LEFT JOIN fact_accident fa ON d.driver_id = fa.driver_id
                GROUP BY d.driver_id
                ORDER BY d.safety_score_base DESC LIMIT 5
            """
            rows = c.execute(sql_used).fetchall()
            answer = "Voici le top 5 des chauffeurs ayant les meilleurs scores de sécurité dans la base SQLite :"
            results_data = [{'Nom': r['name'], 'Score Sécurité': f"{r['safety_score_base']:.1f}/100", 'Expérience': f"{r['experience_years']} ans", 'Trajets': r['trips'], 'Accidents': r['accidents']} for r in rows]

        elif 'marque' in prompt or 'brand' in prompt or 'constructeur' in prompt or 'scania' in prompt or 'daf' in prompt or 'volvo' in prompt:
            sql_used = """
                SELECT v.brand, COUNT(DISTINCT v.vehicle_id) as vehicles, COUNT(ft.trip_id) as trips, SUM(ft.revenue) as revenue, SUM(ft.margin) as margin
                FROM dim_vehicle v
                LEFT JOIN fact_trip ft ON v.vehicle_id = ft.tractor_id
                GROUP BY v.brand ORDER BY margin DESC
            """
            rows = c.execute(sql_used).fetchall()
            answer = "Analyse comparative des marques de la flotte (Source SQLite `dim_vehicle` & `fact_trip`) :"
            results_data = [{'Marque': r['brand'], 'Nombre Véhicules': r['vehicles'], 'Trajets Total': r['trips'], 'Revenus (€)': f"{r['revenue']/1e6:.2f} M€", 'Marge Nette (€)': f"{r['margin']/1e6:.2f} M€"} for r in rows]

        elif 'accident' in prompt or 'panne' in prompt or 'dommage' in prompt:
            sql_used = """
                SELECT severity, COUNT(*) as count, SUM(damage_cost) as total_damage, AVG(driver_fault)*100 as fault_pct
                FROM fact_accident GROUP BY severity ORDER BY total_damage DESC
            """
            rows = c.execute(sql_used).fetchall()
            answer = "Statistiques exactes des accidents enregistrés dans `fact_accident` :"
            results_data = [{'Gravité': r['severity'], 'Accidents': r['count'], 'Coût Dommages (€)': f"{r['total_damage']:.2f} €", 'Faute Chauffeur (%)': f"{r['fault_pct']:.1f}%"} for r in rows]

        elif 'co2' in prompt or 'carbone' in prompt or 'ecologie' in prompt or 'écologie' in prompt:
            sql_used = """
                SELECT v.fuel_type, COUNT(DISTINCT v.vehicle_id) as count, SUM(ft.fuel_liters) as liters, SUM(ft.actual_distance_km) as distance
                FROM dim_vehicle v JOIN fact_trip ft ON v.vehicle_id = ft.tractor_id GROUP BY v.fuel_type
            """
            rows = c.execute(sql_used).fetchall()
            answer = "Bilan environnemental par type de motorisation dans SQLite :"
            results_data = [{'Carburant': r['fuel_type'], 'Véhicules': r['count'], 'Volume Carburant': f"{r['liters']:,.0f} L", 'Distance (km)': f"{r['distance']:,.0f} km"} for r in rows]

        else:
            sql_used = "SELECT COUNT(*) as total_trips, SUM(revenue) as rev, SUM(margin) as margin FROM fact_trip"
            r = c.execute(sql_used).fetchone()
            answer = f"La base de données compte actuellement **{r['total_trips']:,} trajets** pour un Chiffre d'Affaires total de **{r['rev']/1e6:.2f} M€** et une Marge Nette de **{r['margin']/1e6:.2f} M€**."
            results_data = [{'Métrique': 'Total Trajets', 'Valeur': f"{r['total_trips']:,}"}, {'Métrique': 'Chiffre d\'Affaires', 'Valeur': f"{r['rev']/1e6:.2f} M€"}, {'Métrique': 'Marge Nette', 'Valeur': f"{r['margin']/1e6:.2f} M€"}]

        conn.close()
        self._set_headers(200)
        self.wfile.write(json.dumps({
            'answer': answer,
            'sql': sql_used.strip(),
            'data': results_data
        }).encode('utf-8'))

def run_server():
    server = socketserver.TCPServer(('', PORT), FleetAPIHandler)
    server.allow_reuse_address = True
    print(f"Fleet Analytics API Server v4.0 (0ms In-Memory Cache) listening on port {PORT}...")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()

if __name__ == '__main__':
    run_server()
