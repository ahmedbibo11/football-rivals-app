#!/usr/bin/env python3
"""Fetch jobs + failed-step logs for a workflow run. Token from stdin only."""
import sys, json, urllib.request, urllib.error, io, zipfile

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

jobs = gh(f"/repos/{OWNER}/{REPO}/actions/runs/{RUN_ID}/jobs")
for job in jobs.get("jobs", []):
    print("JOB:", job["name"], job["conclusion"])
    for s in job.get("steps", []):
        print("  step:", s["number"], s["name"], "->", s["conclusion"])

req = urllib.request.Request(f"{API}/repos/{OWNER}/{REPO}/actions/runs/{RUN_ID}/logs")
req.add_header("Authorization", f"Bearer {TOKEN}")
with urllib.request.urlopen(req, timeout=120) as r:
    blob = r.read()
z = zipfile.ZipFile(io.BytesIO(blob))
for name in z.namelist():
    print("=== LOG FILE:", name)
    text = z.read(name).decode("utf-8", "replace")
    lines = text.splitlines()
    # print lines containing error-ish keywords plus the last 30 lines
    hits = [l for l in lines if any(k in l for k in ("error", "Error", "ERROR", "FAILED", "failed", "Exception", "Could not", "What went wrong"))]
    for l in hits[-40:]:
        print("HIT:", l[:300])
    print("--- tail ---")
    for l in lines[-25:]:
        print(l[:300])
