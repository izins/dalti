import urllib.request
import json

try:
    req = urllib.request.urlopen("http://localhost:5000/api/structures")
    data = json.loads(req.read())
    primary = data["structures"][0]
    
    url = f"http://localhost:5000/api/queues/structure/{primary['id']}"
    req2 = urllib.request.urlopen(url)
    data2 = json.loads(req2.read())
    print("QUEUES:", data2)
except urllib.error.HTTPError as e:
    print("ERROR:", e)
    print("BODY:", e.read().decode())
