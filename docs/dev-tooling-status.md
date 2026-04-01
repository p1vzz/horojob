# Dev Tooling Status

Last verified: 2026-04-01 (local)

## Verified working

- Python command:
  - command: `python --version`
  - result: `Python 3.15.0a7`
- Python launcher:
  - command: `py -3 -V`
  - result: `Python 3.15.0a7`
- Direct Python binary:
  - command: `C:\Python315\python.exe --version`
  - result: `Python 3.15.0a7`
- ripgrep command:
  - command: `rg --version`
  - result: `ripgrep 14.1.0`
- ripgrep binary:
  - command: `C:\Users\p1vzz\AppData\Local\Microsoft\WinGet\Packages\BurntSushi.ripgrep.MSVC_Microsoft.Winget.Source_8wekyb3d8bbwe\ripgrep-15.1.0-x86_64-pc-windows-msvc\rg.exe --version`
  - result: `ripgrep 15.1.0`
- Coverage tooling:
  - command: `npm run coverage`
  - result: `coverage/core` (`c8`, node tests) + `coverage/rntl` (`jest-expo`, RNTL tests)
- ESLint quality gate:
  - command: `npm run lint`
  - result: passes with repository-aligned flat config (`eslint.config.mjs`)
- Full validation:
  - command: `npm run verify`
  - result: `typecheck + lint + node tests + RNTL`

## Notes

- `where rg` returns two binaries:
  - `C:\ProgramData\chocolatey\bin\rg.exe`
  - `C:\Users\p1vzz\AppData\Local\Microsoft\WinGet\Packages\BurntSushi.ripgrep.MSVC_Microsoft.Winget.Source_8wekyb3d8bbwe\ripgrep-15.1.0-x86_64-pc-windows-msvc\rg.exe`
- Current default `rg` in `PATH` is the Chocolatey one (`14.1.0`).
- The repo now has a dedicated `lint` script and `verify` includes lint by default.
