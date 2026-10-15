import requests
r=requests.get('http://overpass-api.de/api/interpreter', params={'data': '[out:json];area["name"="Taranto"]->.searchArea;(node["historic"="monument"](area.searchArea););out center;'})
print(r.status_code)
print(r.text)
