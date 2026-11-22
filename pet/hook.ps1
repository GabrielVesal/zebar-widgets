# Chamado pelos hooks do Claude Code. Registra o estado de cada sessao em
# agents.json, que o widget do pet le para saber o que os agentes estao fazendo.
# Uso: hook.ps1 <working|waiting|done|end>   (o Claude Code manda um JSON no stdin)
param([string]$State = 'working')

$ErrorActionPreference = 'SilentlyContinue'

# Perguntas rapidas feitas pelo proprio pet nao contam como agente.
if ($env:PET_QUICK) { exit 0 }
$file = Join-Path $PSScriptRoot 'agents.json'

$raw = [Console]::In.ReadToEnd()
$data = $null
if ($raw) { $data = $raw | ConvertFrom-Json }
if (-not $data -or -not $data.session_id) { exit 0 }

$now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

# Processo do Claude Code que chamou este hook. Serve para descobrir depois
# se a sessao morreu sem avisar (terminal fechado no X, por exemplo).
$claudePid = 0
$me = Get-CimInstance Win32_Process -Filter "ProcessId=$PID"
if ($me) { $claudePid = [int]$me.ParentProcessId }
$maxAge = 12 * 60 * 60 * 1000

for ($try = 0; $try -lt 5; $try++) {
  try {
    $agents = @{}
    if (Test-Path $file) {
      $old = Get-Content $file -Raw | ConvertFrom-Json
      if ($old) {
        foreach ($p in $old.PSObject.Properties) {
          if ($now - $p.Value.ts -ge $maxAge) { continue }
          # Descarta sessoes cujo processo do Claude nao existe mais.
          if ($p.Value.pid -and -not (Get-Process -Id $p.Value.pid)) { continue }
          $agents[$p.Name] = $p.Value
        }
      }
    }

    if ($State -eq 'end') {
      $agents.Remove($data.session_id)
    } else {
      $agents[$data.session_id] = @{
        state = $State
        cwd   = [string]$data.cwd
        ts    = $now
        pid   = $claudePid
      }
    }

    $json = $agents | ConvertTo-Json -Depth 4 -Compress
    if (-not $json) { $json = '{}' }
    [IO.File]::WriteAllText($file, $json, (New-Object Text.UTF8Encoding($false)))
    break
  } catch {
    Start-Sleep -Milliseconds 40
  }
}
exit 0
