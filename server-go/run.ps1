$env:GOMODCACHE = "D:\go\pkg\mod"
$env:GOCACHE = "D:\go\cache"
Set-Location $PSScriptRoot
if (Test-Path .\interviewiq.exe) {
  .\interviewiq.exe
} else {
  go run .
}
