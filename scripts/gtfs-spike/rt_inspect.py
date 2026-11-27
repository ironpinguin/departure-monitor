"""Summarise the structure of a GTFS-RT feed.
Usage: rt_inspect.py <rt.pb>"""
import sys, collections, datetime
from google.transit import gtfs_realtime_pb2 as pb
f = pb.FeedMessage(); f.ParseFromString(open(sys.argv[1],'rb').read())
print('header', f.header.gtfs_realtime_version, datetime.datetime.fromtimestamp(f.header.timestamp), 'entities', len(f.entity))
c = collections.Counter()
for e in f.entity:
    c['trip_update' if e.HasField('trip_update') else 'vehicle' if e.HasField('vehicle') else 'alert' if e.HasField('alert') else 'other'] += 1
    if e.HasField('trip_update'):
        tu = e.trip_update
        c['rel_'+str(tu.trip.schedule_relationship)] += 1
        c['has_start_date'] += bool(tu.trip.start_date)
        for s in tu.stop_time_update:
            c['stu'] += 1
            c['stu_stop_id'] += bool(s.stop_id); c['stu_seq'] += s.HasField('stop_sequence')
            c['stu_dep_delay'] += s.departure.HasField('delay'); c['stu_dep_time'] += s.departure.HasField('time')
            c['stu_rel_'+str(s.schedule_relationship)] += 1
print(dict(c))
n=0
for e in f.entity:
    if e.HasField('trip_update') and len(e.trip_update.stop_time_update)>2:
        print(str(e)[:900]); n+=1
        if n==1: break
