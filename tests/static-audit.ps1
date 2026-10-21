$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$failures = [System.Collections.Generic.List[string]]::new()

function Require-File([string]$relativePath) {
    $path = Join-Path $projectRoot $relativePath
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        $failures.Add("Missing file: $relativePath")
        return $null
    }
    return Get-Content -Raw -Encoding UTF8 -LiteralPath $path
}

function Require-Match([string]$content, [string]$pattern, [string]$message) {
    if ($null -eq $content -or $content -notmatch $pattern) { $failures.Add($message) }
}

function Reject-Match([string]$content, [string]$pattern, [string]$message) {
    if ($null -ne $content -and $content -match $pattern) { $failures.Add($message) }
}

function Require-Literal([string]$content, [string]$literal, [string]$message) {
    if ($null -eq $content -or -not $content.Contains($literal)) { $failures.Add($message) }
}

$html = Require-File 'index.html'
$css = Require-File 'styles.css'
$app = Require-File 'app.js'
$data = Require-File 'news-data.js'
$readme = Require-File 'README.md'
$sourcePolicy = Require-File 'docs/source-policy.md'
$verificationPolicy = Require-File 'docs/verification-policy.md'
$updateGuide = Require-File 'docs/update-guide.md'

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

if ($null -ne $css) {
    foreach ($token in @('#002FA7', '#06143D', '#F5F7FC', '#29C98A', '#FFB84D', '#FF5B6E')) {
        Require-Match $css ([regex]::Escape($token)) "styles.css missing required color $token"
    }
    Require-Match $css '@media\s*\(prefers-reduced-motion:\s*reduce\)' 'Missing reduced-motion media query'
    Require-Match $css '@media\s*\(max-width:' 'Missing narrow-screen media query'
    Require-Match $css '@media\s+print' 'Missing print styles'
    Require-Match $css ':focus-visible' 'Missing visible keyboard focus styles'
    Reject-Match $css '(?i)url\([^)]*https?://' 'CSS contains a remote URL'
    Reject-Match $css '(?i)@import' 'CSS must not import remote or local stylesheets'
    Reject-Match $css '(?i)animation(?:-iteration-count)?\s*:[^;]*infinite' 'CSS contains an infinite animation'
}

$combinedScripts = "$app`n$data"
Reject-Match $combinedScripts '(?i)\bfetch\s*\(' 'Scripts must not call fetch'
Reject-Match $combinedScripts '(?i)\bXMLHttpRequest\b' 'Scripts must not call XMLHttpRequest'
Reject-Match $combinedScripts '(?i)\bWebSocket\b' 'Scripts must not create WebSocket connections'
Reject-Match $combinedScripts '(?i)serviceWorker' 'Scripts must not register a Service Worker'
Reject-Match $combinedScripts '(?i)(google-analytics|googletagmanager|clarity|hm\.baidu|segment\.com)' 'Analytics or tracking code found'
Reject-Match $combinedScripts '(?i)(api[_-]?key|secret[_-]?key)\s*[:=]\s*"[A-Za-z0-9_-]{16,}' 'Possible embedded secret found'

if ($null -ne $readme) {
    foreach ($marker in @('double-click', 'news-data.js', 'add-company', 'backup', 'offline', 'Network')) {
        Require-Literal $readme $marker "README.md missing required marker: $marker"
    }
}

if ($null -ne $sourcePolicy) {
    Require-Match $sourcePolicy 'source-tiers' 'source-policy.md missing source-tiers section'
    Require-Match $sourcePolicy 'forbidden-sources' 'source-policy.md missing forbidden-sources section'
}

if ($null -ne $verificationPolicy) {
    Require-Match $verificationPolicy 'verification-levels' 'verification-policy.md missing verification-levels section'
    Require-Match $verificationPolicy 'dual-source' 'verification-policy.md missing dual-source rule'
}

if ($null -ne $updateGuide) {
    Require-Match $updateGuide 'manual-update' 'update-guide.md missing manual-update section'
    Require-Match $updateGuide 'rollback' 'update-guide.md missing rollback section'
}

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Error $_ -ErrorAction Continue }
    Write-Output "STATIC AUDIT FAIL: $($failures.Count) issue(s)"
    exit 1
}

Write-Output 'STATIC AUDIT PASS: structure present; no automatic external-request capability found.'
exit 0
