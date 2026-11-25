#!/usr/bin/env python3
"""Create a GitHub Release on the public repo and upload the trial APK as a
release asset, producing a permanent direct download URL. Token from stdin."""
import sys, json, urllib.request, urllib.error, os

TOKEN = sys.stdin.read().strip()
OWNER, REPO = "ahmedbibo11", "football-rivals-app"
TAG = "v1.0-trial"
APK = os.path.expanduser("~/workspace/football-rivals-app/Football-Rivals.apk")

def gh(method, url, body=None, ctype="application/json"):
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("Accept", "application/vnd.github+json")
    data = None
    if body is not None:
        data = json.dumps(body).encode() if ctype == "application/json" else body
        req.add_header("Content-Type", ctype)
    try:
        with urllib.request.urlopen(req, data=data, timeout=900) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read()
        try: msg = json.loads(raw)
        except Exception: msg = {"raw": raw[:200].decode("utf-8", "replace")}
        return e.code, msg

# create release (or reuse if it already exists)
st, rel = gh("POST", f"https://api.github.com/repos/{OWNER}/{REPO}/releases", {
    "tag_name": TAG,
    "name": "Football Rivals — Trial APK (v1.0)",
    "body": "Real APK with the full game bundled inside (Capacitor). Debug-signed trial build for direct installation. The game runs locally on the phone; account/sync features call the live backend.",
    "draft": False, "prerelease": True,
})
if st not in (200, 201):
    st2, rel2 = gh("GET", f"https://api.github.com/repos/{OWNER}/{REPO}/releases/tags/{TAG}")
    if st2 == 200:
        rel = rel2; print("release exists, reusing")
    else:
        print("RELEASE_CREATE_FAILED:", st, rel); sys.exit(1)
print("release:", rel.get("html_url"))

# upload asset (delete an existing same-name asset first, if any)
for a in rel.get("assets", []):
    if a["name"] == "Football-Rivals.apk":
        gh("DELETE", f"https://api.github.com/repos/{OWNER}/{REPO}/releases/assets/{a['id']}")
        print("removed old asset")

upload_url = rel["upload_url"].split("{")[0] + "?name=Football-Rivals.apk"
size = os.path.getsize(APK)
print("uploading", size, "bytes...")
with open(APK, "rb") as f:
    blob = f.read()
st, asset = gh("POST", upload_url, body=blob, ctype="application/vnd.android.package-archive")
if st not in (200, 201):
    print("UPLOAD_FAILED:", st, asset); sys.exit(2)
print("DOWNLOAD_URL:", asset.get("browser_download_url"))
print("asset size:", asset.get("size"))
print("DONE")
