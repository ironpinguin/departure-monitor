"""Stage 1: cut the Germany-wide feed down to the Würzburg region.
Usage: filter.py <gtfs_dir> <zip> <out_dir>"""
import csv, sys, os, time, subprocess, collections
g, z, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
BBOX = (49.60, 49.95, 9.70, 10.20)  # lat_min, lat_max, lon_min, lon_max
t0 = time.time()
stops = {}
with open(f'{g}/stops.txt', newline='', encoding='utf-8') as f:
    for r in csv.DictReader(f):
        try: la, lo = float(r['stop_lat']), float(r['stop_lon'])
        except ValueError: continue
        if BBOX[0] <= la <= BBOX[1] and BBOX[2] <= lo <= BBOX[3]:
            stops[r['stop_id']] = r
print(f'stops in bbox: {len(stops)} ({time.time()-t0:.1f}s)')
# pass 1: trips touching the region
t0 = time.time()
p = subprocess.Popen(['unzip', '-p', z, 'stop_times.txt'], stdout=subprocess.PIPE)
header = p.stdout.readline()
trips = set(); n = 0
for line in p.stdout:
    n += 1
    parts = line.split(b',', 4)
    if parts[3].decode() in stops: trips.add(parts[0])
p.wait()
print(f'stop_times rows: {n}, trips touching region: {len(trips)} ({time.time()-t0:.1f}s)')
# pass 2: keep full stop_times of those trips (needed for destination + delay propagation)
t0 = time.time()
p = subprocess.Popen(['unzip', '-p', z, 'stop_times.txt'], stdout=subprocess.PIPE)
kept = 0; extra_stops = set()
with open(f'{out}/stop_times.txt', 'wb') as o:
    o.write(p.stdout.readline())
    for line in p.stdout:
        parts = line.split(b',', 4)
        if parts[0] in trips:
            o.write(line); kept += 1; extra_stops.add(parts[3].decode())
p.wait()
print(f'kept stop_times rows: {kept} ({time.time()-t0:.1f}s)')
tids = {t.decode() for t in trips}
def cp(name, keep):
    k = 0
    with open(f'{g}/{name}', newline='', encoding='utf-8') as f, open(f'{out}/{name}', 'w', newline='', encoding='utf-8') as o:
        rd = csv.DictReader(f); w = csv.DictWriter(o, rd.fieldnames); w.writeheader()
        for r in rd:
            if keep(r): w.writerow(r); k += 1
    return k
routes, services = set(), set()
def kt(r):
    if r['trip_id'] in tids: routes.add(r['route_id']); services.add(r['service_id']); return True
print('trips', cp('trips.txt', kt))
agencies = set()
def kr(r):
    if r['route_id'] in routes: agencies.add(r['agency_id']); return True
print('routes', cp('routes.txt', kr))
print('agency', cp('agency.txt', lambda r: r['agency_id'] in agencies))
print('calendar', cp('calendar.txt', lambda r: r['service_id'] in services))
print('calendar_dates', cp('calendar_dates.txt', lambda r: r['service_id'] in services))
allstops = set(stops) | extra_stops
print('stops', cp('stops.txt', lambda r: r['stop_id'] in allstops))
