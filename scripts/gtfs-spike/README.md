# gtfs.de spike (issue #72)

Throwaway scripts that check whether gtfs.de static GTFS + GTFS-RT can replace
the blocked Würzburg EFA endpoint. Results are in issue #72. Not part of the app
or the build.

## Setup

```bash
python3 -m venv venv && ./venv/bin/pip install gtfs-realtime-bindings
mkdir -p data/gtfs
curl -L -o data/de_nv.zip https://download.gtfs.de/germany/nv_free/latest.zip   # 282 MB
curl -L --compressed -o data/rt.pb https://realtime.gtfs.de/realtime-free.pb    # 20 MB
unzip -o data/de_nv.zip -x stop_times.txt -d data/gtfs
```

## Scripts

| Script | Purpose |
|---|---|
| `filter.py data/gtfs data/de_nv.zip data/wue` | Cut the Germany-wide feed down to the Würzburg region (bounding box). |
| `board.py data/wue data/rt.pb YYYYMMDD HH:MM "Juliuspromenade" …` | Departure board per stop name with real-time delays, plus coverage for the city area. |
| `cov.py data/wue data/rt.pb YYYYMMDD HH:MM` | Which lines have real-time for trips running at that time. |
| `rt_inspect.py data/rt.pb` | Structure of the real-time feed. |

Date and time must match the moment `rt.pb` was fetched.

Licences: static feed CC BY 4.0, real-time feed CC BY-SA 4.0 (gtfs.de, DELFI e.V.).
