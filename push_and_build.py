#!/usr/bin/env python3
"""Push the Football Rivals app repo, dispatch the APK build, download the artifact.
Token is read from stdin ONLY. Never printed, never stored."""
import sys, json, time, subprocess, urllib.request, urllib.error, io, zipfile, os

TOKEN = sys.stdin.read().strip()
if not TOKEN:
    print("NO_TOKEN"); sys.exit(1)

OWNER, REPO = "ahmedbibo11", "football-rivals-app"
API = "https://api.github.com"

def gh(method, path, body=None):
    req = urllib.request.Request(API + path, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, data=data, timeout=60) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read()
        try: msg = json.loads(raw).get("message", "")
        except Exception: msg = ""
        return e.code, {"message": msg}

# 1) whoami + repo check
st, me = gh("GET", "/user")
print("user:", st, me.get("login"))
st, repo = gh("GET", f"/repos/{OWNER}/{REPO}")
print("repo:", st, repo.get("full_name"), "private:", repo.get("private"), "size:", repo.get("size"))
if st != 200:
    print("REPO_NOT_ACCESSIBLE"); sys.exit(2)

# 2) push (token only inside this process's argv for git, never printed)
push_url = f"https://x-access-token:{TOKEN}@github.com/{OWNER}/{REPO}.git"
p = subprocess.run(
    ["git", "-C", os.path.dirname(os.path.abspath(__file__)),
     "-c", "http.postBuffer=524288000",
     "push", push_url, "main"],
    capture_output=True, text=True, timeout=1200)
print("push rc:", p.returncode)
tail = (p.stderr or p.stdout).strip().splitlines()
for line in tail[-4:]:
    print("push>", line.replace(TOKEN, "***"))
if p.returncode != 0:
    print("PUSH_FAILED"); sys.exit(3)

# 3) dispatch workflow
st, r = gh("POST", f"/repos/{OWNER}/{REPO}/actions/workflows/build-apk.yml/dispatches", {"ref": "main"})
print("dispatch:", st, r.get("message", ""))

# 4) poll the run
run_id = None
for _ in range(40):
    time.sleep(15)
    st, runs = gh("GET", f"/repos/{OWNER}/{REPO}/actions/workflows/build-apk.yml/runs?per_page=3")
    items = runs.get("workflow_runs", []) if isinstance(runs, dict) else []
    if items:
        run = items[0]
        run_id = run["id"]
        print("run:", run["status"], run.get("conclusion"), run["html_url"], flush=True)
        if run["status"] == "completed":
            break
if not run_id:
    print("NO_RUN_FOUND"); sys.exit(4)

st, run = gh("GET", f"/repos/{OWNER}/{REPO}/actions/runs/{run_id}")
if run.get("conclusion") != "success":
    print("BUILD_NOT_SUCCESS:", run.get("conclusion"), run["html_url"]); sys.exit(5)

# 5) download artifact zip, extract the APK
st, arts = gh("GET", f"/repos/{OWNER}/{REPO}/actions/runs/{run_id}/artifacts")
items = arts.get("artifacts", [])
if not items:
    print("NO_ARTIFACTS"); sys.exit(6)
art = items[0]
print("artifact:", art["name"], art["size_in_bytes"])
req = urllib.request.Request(art["archive_download_url"])
req.add_header("Authorization", f"Bearer {TOKEN}")
req.add_header("Accept", "application/vnd.github+json")
with urllib.request.urlopen(req, timeout=600) as r:
    blob = r.read()
z = zipfile.ZipFile(io.BytesIO(blob))
print("zip contents:", z.namelist())
dest = os.path.expanduser("~/workspace/football-rivals-app/Football-Rivals.apk")
for name in z.namelist():
    if name.endswith(".apk"):
        with z.open(name) as src, open(dest, "wb") as out:
            out.write(src.read())
        print("APK_SAVED:", dest, os.path.getsize(dest))
print("RUN_URL:", run["html_url"])
print("ALL_DONE")
