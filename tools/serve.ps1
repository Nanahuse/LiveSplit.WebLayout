param([int]$Port = 8080, [string]$Root = '')
$ErrorActionPreference = 'Stop'
if (!$Root) {
    if (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'livesplit.js')) { $Root = $PSScriptRoot }
    else { $Root = Join-Path $PSScriptRoot '../dist' }
}
$basePath = (Resolve-Path -LiteralPath $Root).Path.TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Host "LiveSplit.WebLayout: http://127.0.0.1:$Port/ (Ctrl+C to stop)"
$types = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.png'='image/png'; '.ico'='image/x-icon'; '.svg'='image/svg+xml' }
try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $client.ReceiveTimeout = 3000; $client.SendTimeout = 3000
            $stream = $client.GetStream()
            # Bound header size and request duration. This server is read-only and loopback-only.
            $header = [Collections.Generic.List[byte]]::new()
            while ($header.Count -lt 8192) {
                $b = $stream.ReadByte(); if ($b -lt 0) { break }; $header.Add([byte]$b)
                $n = $header.Count
                if ($n -ge 4 -and $header[$n-4] -eq 13 -and $header[$n-3] -eq 10 -and $header[$n-2] -eq 13 -and $header[$n-1] -eq 10) { break }
            }
            $request = ([Text.Encoding]::ASCII.GetString($header.ToArray()) -split "`r`n")[0] -split ' '
            $status = '404 Not Found'; $body = [Text.Encoding]::UTF8.GetBytes('Not found'); $type = 'text/plain; charset=utf-8'
            if ($request.Count -ge 2 -and $request[0] -in @('GET', 'HEAD')) {
                $relative = [Uri]::UnescapeDataString(($request[1] -split '\?')[0]).TrimStart('/')
                if (!$relative) { $relative = 'index.html' }
                $path = [IO.Path]::GetFullPath((Join-Path $basePath $relative))
                $extension = [IO.Path]::GetExtension($path).ToLowerInvariant()
                if ($path.StartsWith($basePath, [StringComparison]::OrdinalIgnoreCase) -and $types.ContainsKey($extension) -and (Test-Path -LiteralPath $path -PathType Leaf)) {
                    $body = [IO.File]::ReadAllBytes($path); $type = $types[$extension]; $status = '200 OK'
                }
            }
            $response = [Text.Encoding]::ASCII.GetBytes("HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store`r`nX-Content-Type-Options: nosniff`r`nConnection: close`r`n`r`n")
            $stream.Write($response, 0, $response.Length)
            if ($request[0] -ne 'HEAD') { $stream.Write($body, 0, $body.Length) }
        } catch { Write-Verbose $_.Exception.Message }
        finally { $client.Dispose() }
    }
} finally { $listener.Stop() }
