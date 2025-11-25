"""
create_restructure.py

Safely create directories and relocate files to match the target workspace layout.

Usage:
  python create_restructure.py [--dry-run] [--yes]

By default the script runs in --dry-run mode which only prints actions.
Pass --yes to perform the moves. The script will never delete files; when a move would overwrite an existing file it will create a backup (appending a timestamp).

Notes:
- Idempotent: re-running after a completed run will skip already-correct items.
- Safe: backups created for conflicts, and missing source files are reported but do not error.
"""
from __future__ import annotations

import argparse
import shutil
from datetime import datetime
from pathlib import Path
import sys
import json


ROOT = Path(__file__).resolve().parent


def timestamp() -> str:
    return datetime.now().strftime("%Y%m%d%H%M%S")


def ensure_dirs(dirs: list[Path], dry_run: bool) -> None:
    for d in dirs:
        if d.exists():
            print(f"[OK] dir exists: {d}")
            continue
        if dry_run:
            print(f"[DRY] would create dir: {d}")
        else:
            print(f"[CREATE] dir: {d}")
            d.mkdir(parents=True, exist_ok=True)


def backup_file(p: Path) -> Path:
    assert p.exists()
    bak = p.with_name(p.name + ".bak." + timestamp())
    p.rename(bak)
    return bak


def safe_move(src: Path, dest: Path, dry_run: bool) -> None:
    if not src.exists():
        print(f"[MISSING] source not found, skipping: {src}")
        return

    if dest.exists():
        # if same file (by resolved path), skip
        try:
            if src.resolve() == dest.resolve():
                print(f"[SKIP] already at destination: {dest}")
                return
        except Exception:
            pass

        # move would overwrite; create backup of dest
        bak = dest.with_name(dest.name + ".bak." + timestamp())
        if dry_run:
            print(f"[DRY] would backup existing dest -> {bak}")
            print(f"[DRY] would move {src} -> {dest}")
            return
        else:
            print(f"[BACKUP] {dest} -> {bak}")
            shutil.move(str(dest), str(bak))

    if dry_run:
        print(f"[DRY] would move {src} -> {dest}")
    else:
        dest.parent.mkdir(parents=True, exist_ok=True)
        print(f"[MOVE] {src} -> {dest}")
        shutil.move(str(src), str(dest))


def write_placeholder(path: Path, content: str, dry_run: bool) -> None:
    if path.exists():
        print(f"[EXISTS] placeholder exists: {path}")
        return
    if dry_run:
        print(f"[DRY] would write placeholder: {path}")
    else:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        print(f"[WRITE] placeholder: {path}")


def build_plan(root: Path) -> dict:
    # mapping of desired target directories and sample files to create/move
    plan = {}

    # exact directories per requested architecture
    plan_dirs = [
        root / "backend" / "src" / "api" / "routes",
        root / "backend" / "src" / "api" / "middleware",
        root / "backend" / "src" / "services" / "orders",
        root / "backend" / "src" / "models",
        root / "backend" / "src" / "config",
        root / "backend" / "src" / "utils",
        root / "backend" / "tests" / "unit",
        root / "backend" / "tests" / "integration",
        root / "backend" / "tests" / "fixtures",
        root / "frontend" / "public" / "assets" / "images",
        root / "frontend" / "src" / "js" / "app",
        root / "frontend" / "src" / "js" / "services",
        root / "frontend" / "src" / "js" / "utils",
        root / "frontend" / "src" / "css" / "components",
        root / "frontend" / "src" / "css" / "layout",
        root / "frontend" / "src" / "scss",
        root / "shared" / "constants",
        root / "shared" / "utils",
        root / "square" / "api" / "routes",
        root / "square" / "api" / "middleware",
        root / "square" / "services",
        root / "square" / "config",
        root / "square" / "models",
        root / "square" / "utils",
        root / "docs" / "api",
        root / "docs" / "deployment",
        root / "docs" / "operations",
        root / "scripts",
        root / ".github" / "workflows",
        root / "docker" / "nginx",
        root / "logs",
    ]

    moves = []

    # move server.js to backend/server.js
    moves.append({"src": root / "server.js", "dest": root / "backend" / "server.js"})

    # move lib files into backend config/middleware
    moves.append({"src": root / "lib" / "db.js", "dest": root / "backend" / "src" / "config" / "database.js"})
    moves.append({"src": root / "lib" / "auth.js", "dest": root / "backend" / "src" / "api" / "middleware" / "authentication.js"})

    # ensure primary backend files
    moves.append({"src": root / "start.py", "dest": root / "backend" / "src" / "app.py"})

    # Move the entire public/ directory to frontend/public to preserve all relative paths
    # This avoids breaking frontend styling/layout by keeping HTML asset references intact.
    moves.append({"src": root / "public", "dest": root / "frontend" / "public"})

    # Reorganize existing square/ content into the centralized square layout
    # Move routes -> square/api/routes
    moves.append({"src": root / "square" / "routes" / "checkout.js", "dest": root / "square" / "api" / "routes" / "checkout.js"})
    moves.append({"src": root / "square" / "routes" / "webhooks.js", "dest": root / "square" / "api" / "routes" / "webhooks.js"})
    moves.append({"src": root / "square" / "middleware" / "webhook-verification.js", "dest": root / "square" / "api" / "middleware" / "webhookVerification.js"})

    # services: rename existing service files to service naming convention if present
    moves.append({"src": root / "square" / "services" / "checkout.js", "dest": root / "square" / "services" / "checkoutService.js"})
    moves.append({"src": root / "square" / "services" / "payments.js", "dest": root / "square" / "services" / "paymentService.js"})
    moves.append({"src": root / "square" / "services" / "webhooks.js", "dest": root / "square" / "services" / "webhookService.js"})

    # config
    moves.append({"src": root / "square" / "config" / "client.js", "dest": root / "square" / "config" / "client.js"})
    # tokens.json -> environment.js (if tokens exist, keep as tokens.json and also create environment.js placeholder)
    moves.append({"src": root / "square" / "config" / "tokens.json", "dest": root / "square" / "config" / "tokens.json"})

    # move any top-level square utils/helpers
    moves.append({"src": root / "square" / "utils" / "helpers.js", "dest": root / "square" / "utils" / "squareHelpers.js"})

    # shared directory placeholders (create files)

    plan["dirs"] = [str(p) for p in plan_dirs]
    plan["moves"] = [{"src": str(m["src"]), "dest": str(m["dest"])} for m in moves]

    plan["placeholders"] = [
        {"path": str(root / "backend" / "src" / "app.js"), "content": "// backend express app placeholder\n"},
        {"path": str(root / "backend" / "package.json"), "content": json.dumps({"name": "backend","private": True}, indent=2)},
        {"path": str(root / "backend" / "package-lock.json"), "content": "{}\n"},
        {"path": str(root / "frontend" / "package.json"), "content": json.dumps({"name": "frontend","private": True}, indent=2)},
        {"path": str(root / "frontend" / "package-lock.json"), "content": "{}\n"},
        {"path": str(root / "backend" / "src" / "api" / "routes" / "health.js"), "content": "// health route placeholder\nmodule.exports = (req, res) => res.send('ok')\n"},
        {"path": str(root / "backend" / "src" / "api" / "routes" / "orders.js"), "content": "// orders route placeholder\n"},
        {"path": str(root / "backend" / "src" / "api" / "middleware" / "errorHandler.js"), "content": "// error handler placeholder\n"},
        {"path": str(root / "backend" / "src" / "api" / "middleware" / "rateLimiter.js"), "content": "// rate limiter placeholder\n"},
        {"path": str(root / "backend" / "src" / "api" / "middleware" / "security.js"), "content": "// security placeholder\n"},
        {"path": str(root / "backend" / "src" / "services" / "orders" / "orderService.js"), "content": "// order service placeholder\n"},
        {"path": str(root / "backend" / "src" / "models" / "Order.js"), "content": "// Order model placeholder\n"},
        {"path": str(root / "backend" / "src" / "models" / "Payment.js"), "content": "// Payment model placeholder\n"},
        {"path": str(root / "backend" / "src" / "config" / "environment.js"), "content": "// environment config placeholder\n"},
        {"path": str(root / "backend" / "src" / "utils" / "logger.js"), "content": "// logger placeholder\n"},
        {"path": str(root / "backend" / "src" / "utils" / "validation.js"), "content": "// validation placeholder\n"},
        {"path": str(root / "backend" / "src" / "utils" / "helpers.js"), "content": "// helpers placeholder\n"},
        {"path": str(root / "square" / "models" / "SquareOrder.js"), "content": "// SquareOrder model placeholder\n"},
        {"path": str(root / "square" / "config" / "environment.js"), "content": "// square environment placeholder\n"},
        {"path": str(root / "square" / "utils" / "squareHelpers.js"), "content": "// square helpers placeholder\n"},
        {"path": str(root / "shared" / "constants" / "paymentStates.js"), "content": "// payment states\nmodule.exports = {}\n"},
        {"path": str(root / "shared" / "constants" / "orderStatus.js"), "content": "// order status\nmodule.exports = {}\n"},
        {"path": str(root / "shared" / "utils" / "logger.js"), "content": "// shared logger\n"},
        {"path": str(root / "shared" / "utils" / "formatters.js"), "content": "// formatters\n"},
        {"path": str(root / "scripts" / "deploy.sh"), "content": "#!/usr/bin/env bash\n# deploy placeholder\n"},
        {"path": str(root / "scripts" / "backup-db.sh"), "content": "#!/usr/bin/env bash\n# backup placeholder\n"},
        {"path": str(root / "scripts" / "health-check.sh"), "content": "#!/usr/bin/env bash\n# health check placeholder\n"},
        {"path": str(root / ".github" / "workflows" / "ci.yml"), "content": "# CI workflow placeholder\n"},
        {"path": str(root / ".github" / "workflows" / "deploy.yml"), "content": "# deploy workflow placeholder\n"},
        {"path": str(root / "docker" / "Dockerfile"), "content": "# placeholder Dockerfile\n"},
        {"path": str(root / "docker" / "docker-compose.yml"), "content": "# placeholder docker-compose\n"},
        {"path": str(root / "docker" / "nginx" / "nginx.conf"), "content": "# nginx placeholder\n"},
        {"path": str(root / "logs" / "access.log"), "content": ""},
        {"path": str(root / "logs" / "error.log"), "content": ""},
        {"path": str(root / "logs" / "payments.log"), "content": ""},
        {"path": str(root / ".env"), "content": "# env file\n"},
        {"path": str(root / ".env.example"), "content": "# example env\nPORT=3000\n"},
        {"path": str(root / ".gitignore"), "content": "node_modules/\n.env\n"},
        {"path": str(root / ".eslintrc.js"), "content": "module.exports = {}\n"},
        {"path": str(root / "CHANGELOG.md"), "content": "# Changelog\n"},
        {"path": str(root / "LICENSE"), "content": ""},
        {"path": str(root / "docker-compose.prod.yml"), "content": "# prod compose placeholder\n"},
    ]

    return plan


def run(plan: dict, dry_run: bool, yes: bool) -> None:
    # create directories
    dirs = [Path(p) for p in plan.get("dirs", [])]
    ensure_dirs(dirs, dry_run)

    # moves
    for m in plan.get("moves", []):
        src = Path(m["src"]).resolve()
        dest = Path(m["dest"]).resolve()

        # if src is a directory, we move all children into dest
        if src.exists() and src.is_dir():
            if dry_run:
                print(f"[DRY] would move directory {src} -> {dest}")
                continue
            # move contents, not the directory itself (to match target structure)
            dest.mkdir(parents=True, exist_ok=True)
            for child in sorted(src.iterdir()):
                child_dest = dest / child.name
                safe_move(child, child_dest, dry_run=False)
            # after moving children, remove empty src dir if empty
            try:
                if not any(src.iterdir()):
                    print(f"[RMDIR] removing empty source dir: {src}")
                    src.rmdir()
            except Exception as e:
                print(f"[WARN] couldn't remove dir {src}: {e}")
        else:
            safe_move(src, dest, dry_run)

    # placeholders
    for ph in plan.get("placeholders", []):
        p = Path(ph["path"]).resolve()
        write_placeholder(p, ph["content"], dry_run)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Safely restructure repository layout")
    parser.add_argument("--dry-run", action="store_true", help="Print actions without making changes (default: True)")
    parser.add_argument("--yes", action="store_true", help="Apply changes (must pass --yes to perform moves)")
    args = parser.parse_args(argv)

    dry_run = not args.yes

    print("Root:", ROOT)
    plan = build_plan(ROOT)

    print("\nPlanned directories to ensure:")
    for d in plan["dirs"]:
        print(" -", d)

    print("\nPlanned moves:")
    for m in plan["moves"]:
        print(f" - {m['src']} -> {m['dest']}")

    print("\nPlanned placeholders:")
    for ph in plan["placeholders"]:
        print(" -", ph["path"]) 

    if dry_run:
        print("\nDRY RUN: no changes will be made. Run with --yes to apply changes.")
    else:
        print("\nApplying changes...")

    if dry_run and not args.yes:
        run(plan, dry_run=True, yes=False)
        print("\nDry run complete.")
        return 0

    # final confirmation if not explicitly yes
    if not args.yes:
        ans = input("Apply changes? Type 'yes' to proceed: ")
        if ans.lower() != "yes":
            print("Aborting.")
            return 1

    run(plan, dry_run=False, yes=True)
    print("\nRestructure complete. Review backups (.bak.*) for any overwritten files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
