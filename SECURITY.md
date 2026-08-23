# Security Policy

## Supported versions

The latest published version on npm is supported.

## Reporting a vulnerability

Email vinymg98@gmail.com. Do not open a public issue for security reports.

Please include:

- A description of the issue
- Steps to reproduce
- Affected versions
- Any known mitigations

You should receive an acknowledgement within 7 days.

## Trust boundary

`pb verify` runs the commands listed in `pilotbook.config.yml` under `checks.commands`. Those commands execute at the same trust level as `package.json` scripts — they are not sandboxed. Do not point `checks.commands` at untrusted input. Arguments are passed as an argv array; Pilotbook never interpolates them through a shell.
