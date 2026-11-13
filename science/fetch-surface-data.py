"""Refresh the exact sourced display assets. Requires Pillow; no AI-generated terrain."""
import urllib.parse,urllib.request,concurrent.futures,io,json,pathlib,hashlib,xml.etree.ElementTree as ET
from PIL import Image
root=pathlib.Path('public');(root/'data').mkdir(exist_ok=True);(root/'textures').mkdir(exist_ok=True)
service='https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/'
xml=urllib.request.urlopen(service+'WMTSCapabilities.xml',timeout=30).read();(root/'data/trek-wac-capabilities.xml').write_bytes(xml)
# Verify the actual advertised grid rather than assuming dimensions.
ns={'w':'http://www.opengis.net/wmts/1.0','o':'http://www.opengis.net/ows/1.1'}
doc=ET.fromstring(xml);grid=next(g for g in doc.findall('.//w:TileMatrixSet',ns) if g.findtext('o:Identifier',namespaces=ns)=='default028mm');level=next(g for g in grid.findall('w:TileMatrix',ns) if g.findtext('o:Identifier',namespaces=ns)=='2')
assert float(level.findtext('w:MatrixWidth',namespaces=ns))==8 and float(level.findtext('w:MatrixHeight',namespaces=ns))==4
canvas=Image.new('RGB',(2048,1024));urls=[]
def get(rc):
 r,c=rc;u=f'{service}default/default028mm/2/{r}/{c}.jpg';return r,c,u,Image.open(io.BytesIO(urllib.request.urlopen(u,timeout=30).read()))
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for r,c,u,im in pool.map(get,[(r,c)for r in range(4)for c in range(8)]):canvas.paste(im,(c*256,r*256));urls.append(u)
canvas.save(root/'textures/trek-wac.jpg',quality=94);(root/'data/trek-tile-urls.json').write_text(json.dumps(urls,indent=2))
# The chosen observation is pinned by product ID for reproducibility, not whichever item is first today.
u='https://features-api.quickmap.io/collections/nac.geojson?'+urllib.parse.urlencode({'limit':1,'product_id':'"M1463278603LC"'})
b=urllib.request.urlopen(u,timeout=30).read();data=json.loads(b);assert data['features'][0]['properties']['product_id']=='M1463278603LC'
(root/'data/quickmap-observation.json').write_bytes(b);pathlib.Path('data/quickmap-observation.json').write_bytes(b)
print('Verified surface assets refreshed. Update source-manifest retrieval dates when publishing changes.')
