$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$version = (Get-Content -LiteralPath (Join-Path $root 'package.json') -Raw | ConvertFrom-Json).version
if ($version -cnotmatch '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$') {
    throw "Invalid release version: $version"
}

$files = @('dist/index.html', 'dist/timer.html', 'dist/livesplit.js', 'dist/livesplit.css', 'README.md', 'schemas/LICENSE')
$files += Get-ChildItem -LiteralPath (Join-Path $root 'docs') -Recurse -File |
    Sort-Object FullName |
    ForEach-Object { [IO.Path]::GetRelativePath($root, $_.FullName).Replace('\', '/') }
foreach ($file in $files) {
    $path = Join-Path $root $file
    if (!(Test-Path -LiteralPath $path -PathType Leaf) -or (Get-Item -LiteralPath $path).Length -eq 0) {
        throw "Missing or empty distribution file: $file"
    }
}

$output = Join-Path $root 'artifacts'
New-Item -ItemType Directory -Force -Path $output | Out-Null
$name = "LiveSplit.WebLayout-v$version.zip"
$archive = Join-Path $output $name
if (Test-Path -LiteralPath $archive) { Remove-Item -LiteralPath $archive }
$zip = [IO.Compression.ZipFile]::Open($archive, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($file in $files) {
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, (Join-Path $root $file), $file) | Out-Null
    }
    $writer = [IO.StreamWriter]::new($zip.CreateEntry('VERSION.txt').Open())
    try { $writer.WriteLine($version) } finally { $writer.Dispose() }
} finally { $zip.Dispose() }

# Reopen the ZIP to check the actual archive, including paths needed by local-file HTML.
$zip = [IO.Compression.ZipFile]::OpenRead($archive)
try {
    $entries = @($zip.Entries.FullName)
    foreach ($file in @($files) + 'VERSION.txt') {
        if ($file -cnotin $entries -or $zip.GetEntry($file).Length -eq 0) {
            throw "Invalid distribution archive entry: $file"
        }
    }
    if ($entries.Count -ne $files.Count + 1) { throw 'Unexpected distribution archive contents.' }
} finally { $zip.Dispose() }

$hash = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
Set-Content -LiteralPath (Join-Path $output 'SHA256SUMS.txt') -Value "$hash  $name" -Encoding utf8NoBOM
Write-Host "Verified $archive ($($files.Count + 1) files)"
