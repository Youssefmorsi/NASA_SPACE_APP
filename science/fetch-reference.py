"""Download raw independent JPL Horizons observer tables (requires network)."""
import urllib.parse, json, pathlib, concurrent.futures, subprocess
cases=[('equator',0,0,'2026-10-30'),('south',-89.7668,-171.87,'2026-10-30'),('malapert',-85.9948,-0.23578,'2026-11-06'),('farside',10,150,'2026-03-01')]
def fetch(item):
 name,lat,lon,date,body=item
 params={'format':'json','COMMAND':str(body),'EPHEM_TYPE':'OBSERVER','CENTER':'coord@301','COORD_TYPE':'GEODETIC','SITE_COORD':f'{lon},{lat},0','START_TIME':date+' 00:00','STOP_TIME':date+' 01:00','STEP_SIZE':'1 h','QUANTITIES':'4','REF_SYSTEM':'ICRF','CAL_FORMAT':'CAL','ANG_FORMAT':'DEG','APPARENT':'AIRLESS','CSV_FORMAT':'YES','EXTRA_PREC':'YES'}
 url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urllib.parse.urlencode({k:"'"+v+"'" if k!='format' else v for k,v in params.items()})
 data=json.loads(subprocess.check_output(['curl','--fail','--silent','--show-error','--max-time','45',url],text=True))
 if 'error' in data: raise RuntimeError(data['error'])
 return {'id':name,'latitude':lat,'longitude':lon,'time':date+'T00:00:00Z','body':'sun' if body==10 else 'earth','url':url,'raw':data['result']}
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: results=list(pool.map(fetch,[(*c,b) for c in cases for b in [10,399]]))
 pathlib.Path('data/horizons-reference.json').write_text(json.dumps(results,indent=2))
 print('Saved',len(results),'raw Horizons observer tables')
