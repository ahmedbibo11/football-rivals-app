#!/usr/bin/env python3
"""Download the APK artifact of a successful run. Token from stdin only.
The artifact API 302-redirects to a signed URL that must be fetched WITHOUT
the Authorization header (Azure rejects it with 401)."""
import sys, json, urllib.request, urllib.error, io, zipfile, os

TOKEN = sys.stdin.read().strip()
RUN_ID = sys.argv[1]
API = "https://api.github.com"
OWNER, REPO = "ahmedbibo11", "football-rivals-app"

def gh(path):
    req = urllib.request.Request(API + path)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("Accept", "application/vnd.github+json")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())

arts = gh(f"/repos/{OWNER}/{REPO}/actions/runs/{RUN_ID}/artifacts")
art = arts["artifacts"][0]
print("artifact:", art["name"], art["size_in_bytes"])

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

opener = urllib.request.build_opener(NoRedirect)
req = urllib.request.Request(art["archive_download_url"])
req.add_header("Authorization", f"Bearer {TOKEN}")
req.add_header("Accept", "application/vnd.github+json")
try:
    opener.open(req, timeout=60)
    print("NO_REDIRECT — unexpected")
    sys.exit(2)
except urllib.error.HTTPError as e:
    loc = e.headers.get("Location")
    if not loc:
        print("NO_LOCATION", e.code); sys.exit(3)

print("downloading zip...")
with urllib.request.urlopen(loc, timeout=900) as r:
    blob = r.read()
print("zip bytes:", len(blob))
z = zipfile.ZipFile(io.BytesIO(blob))
dest = os.path.expanduser("~/workspace/football-rivals-app/Football-Rivals.apk")
for name in z.namelist():
    if name.endswith(".apk"):
        with z.open(name) as src, open(dest, "wb") as out:
            while True:
                chunk = src.read(1 << 20)
                if not chunk: break
                out.write(chunk)
        print("APK_SAVED:", dest, os.path.getsize(dest))
print("DONE")
