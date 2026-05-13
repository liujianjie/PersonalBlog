# ADR-003: NSSM over Windows Task Scheduler for service auto-start

Status: Accepted (2026-05-09)
Decided in: SPEC §0 / §2

## Context

`blog-caddy` and `blog-cloudflared` need to start on power-on without
the author logging in - the box is a personal workstation that's
sometimes left rebooted overnight. Three Windows-native ways to make
that happen:

1. NSSM (Non-Sucking Service Manager) - wraps an exe as a Service
2. Windows Task Scheduler with "Run whether user is logged on or not"
3. Native Windows service via `sc.exe create` (requires the binary to
   implement the Service Control Manager handshake; cloudflared does,
   caddy does not)

## Decision

**NSSM** for both services. Installed by
`scripts/install-services.ps1` with `ObjectName = LocalSystem` and
`Start = SERVICE_AUTO_START`.

## Consequences

Positive:
- One pattern for both services. caddy.exe is a plain CLI; NSSM is
  the only option for it that doesn't require us to wrap it ourselves.
- No user-login dependency. The author has confirmed in the sibling
  project that Task Scheduler's "Run whether user is logged on or not"
  with a domain account silently stops working after Windows password
  changes / Microsoft account rotations. NSSM-as-LocalSystem dodges
  that.
- Standardized log redirection. `nssm set <name> AppStdout/AppStderr`
  with rotation gets us `logs/blog-*.{out,err}.log` for free.
- Standardized restart-on-crash. `nssm set <name> AppExit Default
  Restart` + 5-second delay handles transient origin-down or DNS
  blips without paging anyone.

Negative:
- Extra binary to ship (`tools/nssm.exe`, gitignored). Mitigated by
  `install-binaries.ps1` downloading it idempotently.
- NSSM 2.24 (latest stable, 2017) hasn't been updated in years.
  Practical risk is low: the codebase is maintenance-mode and the
  surface we use (install/set/start/stop/remove) is stable.
- Diagnosing a stuck service requires reading multiple log streams
  (NSSM stdout, Caddy access log, cloudflared own log, Event Viewer).
  Documented in `docs/deployment.md` "Service management".

What we'd reconsider:
- If Microsoft ships a first-party "wrap any exe as a service"
  feature in a future Windows release (rumored periodically; never
  delivered as of writing), evaluate it as an NSSM replacement.
