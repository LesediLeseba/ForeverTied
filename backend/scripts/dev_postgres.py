#!/usr/bin/env python
"""Run a throwaway local PostgreSQL for development — no Docker required.

The production stack targets any standard PostgreSQL 13+ instance (see
``docker-compose.yml``). In sandboxes/CI where Docker is unavailable this
script initialises a data directory using the PostgreSQL binaries bundled with
the optional ``pgserver`` dependency and listens on ``127.0.0.1:5432`` with the
``postgres/postgres`` credentials the spec's ``DATABASE_URL`` expects.

Usage:
    python scripts/dev_postgres.py start   # initdb (once) + start + create DB
    python scripts/dev_postgres.py status
    python scripts/dev_postgres.py stop
    python scripts/dev_postgres.py reset   # stop, wipe the data dir
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import time
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PGDATA = BACKEND_ROOT / ".pgdata"
DEFAULT_PORT = 5432
DEFAULT_DBNAME = "memorialcode"
DEFAULT_USER = "postgres"


def bin_dir() -> Path:
    """Directory containing the PostgreSQL client/server binaries."""
    try:
        from pgserver._commands import POSTGRES_BIN_PATH
    except ImportError as exc:  # pragma: no cover - dependency missing
        raise SystemExit(
            "pgserver is not installed. Run `pip install -r requirements.txt` "
            "or use a system/Docker PostgreSQL instead."
        ) from exc
    return Path(POSTGRES_BIN_PATH)


def run(cmd: list[str], **kwargs) -> subprocess.CompletedProcess[str]:
    print("+", " ".join(cmd))
    return subprocess.run(cmd, check=True, text=True, capture_output=True, **kwargs)


def is_running(pgdata: Path, port: int) -> bool:
    pg_isready = bin_dir() / "pg_isready"
    result = subprocess.run(
        [str(pg_isready), "-h", "127.0.0.1", "-p", str(port), "-q"],
        capture_output=True,
        text=True,
    )
    return result.returncode == 0


def ensure_database(port: int, dbname: str, user: str) -> None:
    """Create the application database if it does not exist yet."""
    psql = bin_dir() / "psql"
    env = {
        "PGHOST": "127.0.0.1",
        "PGPORT": str(port),
        "PGUSER": user,
        "PATH": "/usr/bin:/bin",
    }
    listed = subprocess.run(
        [str(psql), "-tAc", f"SELECT 1 FROM pg_database WHERE datname = '{dbname}'"],
        capture_output=True,
        text=True,
        env=env,
    )
    if listed.stdout.strip() != "1":
        subprocess.run(
            [str(bin_dir() / "createdb"), dbname],
            check=True,
            capture_output=True,
            text=True,
            env=env,
        )
        print(f"created database '{dbname}'")
    else:
        print(f"database '{dbname}' already exists")


def cmd_start(pgdata: Path, port: int, dbname: str, user: str) -> int:
    if is_running(pgdata, port):
        print(f"PostgreSQL already accepting connections on 127.0.0.1:{port}")
        ensure_database(port, dbname, user)
        return 0

    if not (pgdata / "PG_VERSION").exists():
        pgdata.mkdir(parents=True, exist_ok=True)
        run(
            [
                str(bin_dir() / "initdb"),
                "-D",
                str(pgdata),
                "-U",
                user,
                "--auth=trust",
                "-E",
                "UTF8",
                "--locale=C",
            ]
        )

    log_file = pgdata / "postgres.log"
    run(
        [
            str(bin_dir() / "pg_ctl"),
            "-D",
            str(pgdata),
            "-l",
            str(log_file),
            "-w",
            "-t",
            "60",
            "start",
            "-o",
            f"-p {port} -c listen_addresses=127.0.0.1 "
            f"-c unix_socket_directories={pgdata} -c fsync=off "
            "-c full_page_writes=off",
        ]
    )

    deadline = time.time() + 30
    while time.time() < deadline and not is_running(pgdata, port):
        time.sleep(0.25)
    if not is_running(pgdata, port):
        print(f"PostgreSQL failed to become ready; see {log_file}", file=sys.stderr)
        return 1

    ensure_database(port, dbname, user)
    print(f"\nPostgreSQL ready → postgresql+asyncpg://{user}:{user}@127.0.0.1:{port}/{dbname}")
    return 0


def cmd_stop(pgdata: Path, port: int) -> int:
    if not (pgdata / "PG_VERSION").exists():
        print("no data directory; nothing to stop")
        return 0
    run([str(bin_dir() / "pg_ctl"), "-D", str(pgdata), "-m", "fast", "stop"])
    return 0


def cmd_status(pgdata: Path, port: int) -> int:
    print("running" if is_running(pgdata, port) else "stopped")
    return 0


def cmd_reset(pgdata: Path, port: int) -> int:
    if is_running(pgdata, port):
        cmd_stop(pgdata, port)
    if pgdata.exists():
        shutil.rmtree(pgdata)
        print(f"removed {pgdata}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["start", "stop", "status", "reset"])
    parser.add_argument("--pgdata", default=str(DEFAULT_PGDATA), type=Path)
    parser.add_argument("--port", default=DEFAULT_PORT, type=int)
    parser.add_argument("--dbname", default=DEFAULT_DBNAME)
    parser.add_argument("--user", default=DEFAULT_USER)
    args = parser.parse_args(argv)

    handlers = {
        "start": lambda: cmd_start(args.pgdata, args.port, args.dbname, args.user),
        "stop": lambda: cmd_stop(args.pgdata, args.port),
        "status": lambda: cmd_status(args.pgdata, args.port),
        "reset": lambda: cmd_reset(args.pgdata, args.port),
    }
    return handlers[args.command]()


if __name__ == "__main__":
    raise SystemExit(main())
