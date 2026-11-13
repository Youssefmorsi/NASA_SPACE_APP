"""Independent fixed-width/TLIST queries vs app's CSV/range parser, not an independent ephemeris model."""
import json,urllib.request,urllib.parse,re,datetime,pathlib
examples=json.load(open('public/data/examples.json'));report=[];out=pathlib.Path('data/horizons-verification');out.mkdir(exist_ok=True)
for ex in examples:
 r=ex['result'];req=r['request'];indices=[0,72,168];dates=[r['samples'][i]['time'][:19].replace('T',' ') for i in indices]
 for target,key in [('10','sun'),('399','earth')]:
  p={'format':'json','COMMAND':f"'{target}'",'CENTER':"'coord@301'",'COORD_TYPE':"'GEODETIC'",'SITE_COORD':f"'{req['longitude']},{req['latitude']},{req['observerHeightKm']}'",'MAKE_EPHEM':"'YES'",'EPHEM_TYPE':"'OBSERVER'",'OBJ_DATA':"'NO'",'TLIST':"'"+"' '".join(dates)+"'",'TLIST_TYPE':"'CAL'",'QUANTITIES':"'4'",'CSV_FORMAT':"'NO'",'EXTRA_PREC':"'YES'",'TIME_DIGITS':"'SECONDS'",'APPARENT':"'AIRLESS'",'TIME_TYPE':"'UT'",'CAL_TYPE':"'GREGORIAN'"}
  url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urllib.parse.urlencode(p)
  data=json.load(urllib.request.urlopen(url,timeout=40));raw=data.get('result','');(out/f"{req['latitude']}-{key}.json").write_text(json.dumps({'url':url,'response':data},indent=2))
  if '$$SOE' not in raw:raise RuntimeError(data)
  lines=raw.split('$$SOE')[1].split('$$EOE')[0].strip().splitlines()
  if len(lines)!=3:raise RuntimeError(lines)
  for i,line in zip(indices,lines):
   numbers=re.findall(r'[-+]?\d+\.\d+',line);az,el=map(float,numbers[-2:]);expected=r['samples'][i][key];a=abs((az-expected['azimuth']+180)%360-180);e=abs(el-expected['elevation']);assert a<1e-6 and e<1e-6,(a,e)
   report.append({'location':ex['name'],'time':r['samples'][i]['time'],'target':key,'azimuthDifferenceDeg':a,'elevationDifferenceDeg':e})
  print(ex['name'],key,'passed',flush=True)
json.dump({'method':'Independent fixed-width TLIST API queries compared with application CSV/range parser; not independent ephemeris validation or a manual web-UI check.','directions':len(report),'checks':report},open('public/data/horizons-verification.json','w'),indent=2)
