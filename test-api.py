import requests

try:
    res = requests.get('http://localhost:3000/api/health')
    print(res.status_code)
except Exception as e:
    print(e)
