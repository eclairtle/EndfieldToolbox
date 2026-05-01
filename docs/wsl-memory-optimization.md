# WSL Memory Optimization (EndfieldToolbox)

This project includes many static assets that are not needed for most coding tasks. These steps reduce WSL RAM growth and file-watcher pressure.

## 1) Use repo-level low-memory defaults

- `.codexignore` now excludes heavy folders (`node_modules`, `dist`, large public asset trees).
- `vite.config.ts` now disables `vite-plugin-vue-devtools` unless explicitly enabled.
- Vite watcher ignores large static asset folders.
- `.vscode/settings.json` excludes heavy folders from watcher/search in Remote-WSL.

## 2) Prefer low-memory dev command

```bash
npm run dev:lowmem
```

This starts Vite with:
- `NODE_OPTIONS=--max-old-space-size=2048`
- devtools plugin disabled by default.

If you need devtools temporarily:

```bash
VITE_ENABLE_DEVTOOLS=1 npm run dev
```

## 3) Clear local caches regularly

```bash
npm run clean:caches
```

## 4) Set global WSL memory caps (Windows side)

Create/edit `%UserProfile%\\.wslconfig`:

```ini
[wsl2]
memory=8GB
processors=4
swap=2GB
localhostForwarding=true
pageReporting=true
autoMemoryReclaim=gradual
```

Then restart WSL:

```powershell
wsl --shutdown
```

## 5) Verify memory in distro

```bash
free -h
ps aux --sort=-%mem | head
```

## Notes

- If you frequently edit public images, remove corresponding ignore/watcher exclusions.
- `public/gamedata.json` remains intentionally available for coding tasks.
