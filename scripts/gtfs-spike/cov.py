"""Real-time coverage per line for trips running at a given time.
Usage: cov.py <wue_dir> <rt.pb> <YYYYMMDD> <HH:MM>"""
import csv, sys, collections
from google.transit import gtfs_realtime_pb2 as pb
d, rtfile, date, hhmm = sys.argv[1:5]
def rows(n):
    with open(f'{d}/{n}', newline='', encoding='utf-8') as f: yield from csv.DictReader(f)
routes = {r['route_id']: r for r in rows('routes.txt')}
trips = {r['trip_id']: r for r in rows('trips.txt')}
stops = {r['stop_id']: r for r in rows('stops.txt')}
city = {i for i,s in stops.items() if 49.72<=float(s['stop_lat'])<=49.84 and 9.86<=float(s['stop_lon'])<=10.02}
f = pb.FeedMessage(); f.ParseFromString(open(rtfile,'rb').read())
rt = {e.trip_update.trip.trip_id for e in f.entity if e.HasField('trip_update') and e.trip_update.trip.start_date==date}
# trips running at HH:MM that touch the city area
run = collections.defaultdict(lambda: [None, None, False])
for r in rows('stop_times.txt'):
    x = run[r['trip_id']]; t = r['departure_time'] or r['arrival_time']
    x[0] = t if x[0] is None or t < x[0] else x[0]; x[1] = t if x[1] is None or t > x[1] else x[1]
    x[2] = x[2] or r['stop_id'] in city
import datetime
wd = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'][datetime.datetime.strptime(date,'%Y%m%d').weekday()]
svc = {r['service_id'] for r in rows('calendar.txt') if r[wd]=='1' and r['start_date']<=date<=r['end_date']}
for r in rows('calendar_dates.txt'):
    if r['date']==date: (svc.add if r['exception_type']=='1' else svc.discard)(r['service_id'])
c = collections.defaultdict(lambda: [0,0])
for tid,(a,b,inc) in run.items():
    if inc and trips[tid]['service_id'] in svc and a <= hhmm + ':00' <= b:
        ro = routes[trips[tid]['route_id']]; k = (ro['route_type'], ro['route_short_name'])
        c[k][0]+=1; c[k][1]+= tid in rt
full = sorted(k[1] for k,v in c.items() if v[1]==v[0]); none = sorted(k[1] for k,v in c.items() if v[1]==0); part = {k[1]:v for k,v in c.items() if 0<v[1]<v[0]}
print('trips running now in city:', sum(v[0] for v in c.values()), 'with RT:', sum(v[1] for v in c.values()))
print('lines fully RT:', full); print('lines without RT:', none); print('partial:', part)
