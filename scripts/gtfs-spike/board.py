"""Stage 2: departure board from filtered static GTFS + GTFS-RT snapshot.
Usage: board.py <wue_dir> <rt.pb> <YYYYMMDD> <HH:MM> <stop name query>..."""
import csv, sys, collections, datetime, time, bisect
from google.transit import gtfs_realtime_pb2 as pb
d, rtfile, date, hhmm = sys.argv[1:5]; queries = sys.argv[5:]
def rows(n):
    with open(f'{d}/{n}', newline='', encoding='utf-8') as f: yield from csv.DictReader(f)
t0 = time.time()
stops = {r['stop_id']: r for r in rows('stops.txt')}
routes = {r['route_id']: r for r in rows('routes.txt')}
agency = {r['agency_id']: r['agency_name'] for r in rows('agency.txt')}
trips = {r['trip_id']: r for r in rows('trips.txt')}
def active(day):
    wd = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'][datetime.datetime.strptime(day,'%Y%m%d').weekday()]
    s = {r['service_id'] for r in rows('calendar.txt') if r[wd]=='1' and r['start_date']<=day<=r['end_date']}
    for r in rows('calendar_dates.txt'):
        if r['date']==day: (s.add if r['exception_type']=='1' else s.discard)(r['service_id'])
    return s
svc = active(date)
st = collections.defaultdict(list)   # trip -> rows
for r in rows('stop_times.txt'): st[r['trip_id']].append(r)
for v in st.values(): v.sort(key=lambda r:int(r['stop_sequence']))
load_s = time.time()-t0
# realtime
t0 = time.time()
f = pb.FeedMessage(); f.ParseFromString(open(rtfile,'rb').read())
rt = {}
for e in f.entity:
    if e.HasField('trip_update') and e.trip_update.trip.trip_id in trips and e.trip_update.trip.start_date==date:
        rt[e.trip_update.trip.trip_id] = e.trip_update
rt_s = time.time()-t0
def secs(t): h,m,s = map(int,t.split(':')); return h*3600+m*60+s
now = secs(hhmm+':00')
def delay_for(tid, seq):
    """returns (delay_seconds|None, state) using GTFS-RT delay propagation"""
    tu = rt.get(tid)
    if tu is None: return None, 'no-rt'
    if tu.trip.schedule_relationship == 3: return None, 'cancelled'
    best = None
    for u in tu.stop_time_update:
        if u.stop_sequence > seq: break
        best = u
    if best is None: return None, 'rt-later'      # trip has RT but first update is after this stop
    if best.stop_sequence == seq and best.schedule_relationship == 1: return None, 'skipped'
    dl = best.departure.delay if best.departure.HasField('delay') else best.arrival.delay if best.arrival.HasField('delay') else None
    if dl is None: return None, 'rt-nodata'
    return dl, ('exact' if best.stop_sequence == seq else 'propagated')
def departures(stop_ids, horizon=3600):
    out = []
    for tid, rws in st.items():
        if trips[tid]['service_id'] not in svc: continue
        for r in rws[:-1]:                         # last stop is arrival only
            if r['stop_id'] in stop_ids and r['departure_time']:
                t = secs(r['departure_time'])
                if now-600 <= t <= now+horizon:
                    dl, state = delay_for(tid, int(r['stop_sequence']))
                    if t + (dl or 0) < now: continue
                    out.append((t, dl, state, tid, r, rws[-1]))
    return sorted(out, key=lambda x: x[0]+(x[1] or 0))
RT = {'0':'Tram','1':'U','2':'Zug','3':'Bus','700':'Bus','900':'Tram','100':'Zug','109':'S','106':'RB','400':'U'}
print(f'load static {load_s:.1f}s, parse rt {rt_s:.1f}s, rt trip updates for region today: {len(rt)}, active services: {len(svc)}')
for q in queries:
    m = {i for i,s in stops.items() if q.lower() in s['stop_name'].lower()}
    names = collections.Counter(stops[i]['stop_name'] for i in m)
    print(f'\n=== "{q}": {len(m)} stop ids, names: {dict(names)}')
    for t, dl, state, tid, r, last in departures(m)[:34]:
        ro = routes[trips[tid]['route_id']]
        head = r['stop_headsign'] or stops[last['stop_id']]['stop_name']
        dtxt = '   ' if dl is None else f'{dl/60:+.0f}'.rjust(3)
        print(f"  {r['departure_time'][:5]} {dtxt}  {RT.get(ro['route_type'],ro['route_type']):4} {ro['route_short_name']:5} {head[:38]:38} Stg {stops[r['stop_id']]['platform_code'] or '-':3} [{state}] {agency[ro['agency_id']][:22]}")
# region-wide coverage
allc = collections.Counter(); bya = collections.defaultdict(collections.Counter)
bbox = {i for i,s in stops.items() if 49.72<=float(s['stop_lat'])<=49.84 and 9.86<=float(s['stop_lon'])<=10.02}
for t, dl, state, tid, r, last in departures(bbox):
    a = agency[routes[trips[tid]['route_id']]['agency_id']]
    allc[state]+=1; bya[a][state]+=1
print(f'\n=== city area (≈Stadt Würzburg), departures next 60 min: {sum(allc.values())}  {dict(allc)}')
for a,c in sorted(bya.items(), key=lambda x:-sum(x[1].values())): print(f'  {a[:40]:40} {sum(c.values()):5} {dict(c)}')
dls = [dl for t,dl,*_ in departures(bbox) if dl is not None]
if dls: print(f'  delays: n={len(dls)} nonzero={sum(1 for x in dls if x)} median={sorted(dls)[len(dls)//2]}s max={max(dls)}s min={min(dls)}s')
