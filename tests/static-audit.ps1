$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$failures = [System.Collections.Generic.List[string]]::new()

function Require-File([string]$relativePath) {
    $path = Join-Path $projectRoot $relativePath
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        $failures.Add("Missing file: $relativePath")
        return $null
    }
    return Get-Content -Raw -LiteralPath $path
}

function Require-Match([string]$content, [string]$pattern, [string]$message) {
    if ($null -eq $content -or $content -notmatch $pattern) { $failures.Add($message) }
}

function Reject-Match([string]$content, [string]$pattern, [string]$message) {
    if ($null -ne $content -and $content -match $pattern) { $failures.Add($message) }
}

$html = Require-File 'index.html'
$app = Require-File 'app.js'
$data = Require-File 'news-data.js'

if ($null -ne $html) {
    foreach ($element in @('header', 'nav', 'main', 'section', 'article', 'aside', 'footer', 'form', 'label', 'noscript')) {
        Require-Match $html "<$element(?:\s|>)" "index.html missing semantic element <$element>"
    }
    Require-Match $html 'href="#main-content"' 'Missing skip-to-main link'
    foreach ($id in @('signal-bar', 'featured-stage', 'verification-overview', 'filter-form', 'timeline', 'empty-state', 'source-radar', 'live-region')) {
        Require-Match $html "id=`"$id`"" "Missing DOM container #$id"
    }
    Require-Match $html '<link[^>]+href="styles\.css"' 'Missing local styles.css reference'
    Require-Match $html '<script[^>]+src="news-data\.js"[^>]*></script>\s*<script[^>]+src="app\.js"' 'Script order must be news-data.js then app.js'
    Require-Match $html 'aria-live=' 'Missing aria-live result announcement'
    Reject-Match $html '(?i)(?:src|href)="https?://' 'HTML contains a remote resource attribute'
    Reject-Match $html '(?i)<iframe\b' 'HTML must not contain iframe elements'
    Reject-Match $html '(?i)rel="[^"]*(?:preconnect|prefetch|preload)' 'HTML must not preconnect, prefetch, or preload remote resources'
}

$combinedScripts = "$app`n$data"
Reject-Match $combinedScripts '(?i)\bfetch\s*\(' 'Scripts must not call fetch'
Reject-Match $combinedScripts '(?i)\bXMLHttpRequest\b' 'Scripts must not call XMLHttpRequest'
Reject-Match $combinedScripts '(?i)\bWebSocket\b' 'Scripts must not create WebSocket connections'
Reject-Match $combinedScripts '(?i)serviceWorker' 'Scripts must not register a Service Worker'
Reject-Match $combinedScripts '(?i)(google-analytics|googletagmanager|clarity|hm\.baidu|segment\.com)' 'Analytics or tracking code found'
Reject-Match $combinedScripts '(?i)(api[_-]?key|secret[_-]?key)\s*[:=]\s*"[A-Za-z0-9_-]{16,}' 'Possible embedded secret found'

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Error $_ -ErrorAction Continue }
    Write-Output "STATIC AUDIT FAIL: $($failures.Count) issue(s)"
    exit 1
}

Write-Output 'STATIC AUDIT PASS: structure present; no automatic external-request capability found.'
exit 0
