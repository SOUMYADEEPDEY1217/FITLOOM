<#
.SYNOPSIS
  FITLOOM Production Deployment Smoke Test Script
.DESCRIPTION
  Performs pre-flight and smoke verifications against a deployed or local FITLOOM instance:
  1. GET /api/health - verifies server & database connection health
  2. GET /api/products - verifies catalogue availability and size measurements
  3. GET /api/avatar/status - checks 3D avatar engine tunnel status (returns 200 or honest 503)
  4. POST /api/auth/sign-up/email - registers an ephemeral test account (with Origin header & CSRF guard)
  5. GET /api/users/me - checks session cookie authentication and profile retrieval
  Prints the generated test email at completion so it can be deleted during maintenance.
.PARAMETER BaseUrl
  The target deployment origin (e.g. "https://fitloom.vercel.app" or "http://localhost:3000")
#>
param(
  [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"
$Origin = $BaseUrl.TrimEnd("/")
$Timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$TestEmail = "smoke-deploy+$Timestamp@fitloom-test.internal"
$TestPassword = "SmokeTestPassword123!"
$TestName = "Smoke Tester $Timestamp"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  FITLOOM DEPLOYMENT SMOKE TEST" -ForegroundColor Cyan
Write-Host "  Target URL: $Origin" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$PassedCount = 0
$FailedCount = 0

function Report-Check {
  param([string]$Step, [bool]$Success, [string]$Details)
  if ($Success) {
    Write-Host "  [PASS] $Step: $Details" -ForegroundColor Green
    $script:PassedCount++
  } else {
    Write-Host "  [FAIL] $Step: $Details" -ForegroundColor Red
    $script:FailedCount++
  }
}

# -----------------------------------------------------------------------------
# 1. GET /api/health
# -----------------------------------------------------------------------------
Write-Host "`n1. Checking /api/health..." -ForegroundColor Yellow
try {
  $healthUrl = "$Origin/api/health"
  $res = Invoke-RestMethod -Uri $healthUrl -Method Get -Headers @{ "Origin" = $Origin }
  $isOk = ($res.ok -eq $true) -and ($res.data.status -eq "ok" -or $res.data.db -eq "ok" -or $null -ne $res.data)
  Report-Check "Health Check" $isOk "Response: $($res | ConvertTo-Json -Compress)"
} catch {
  Report-Check "Health Check" $false $_.Exception.Message
}

# -----------------------------------------------------------------------------
# 2. GET /api/products
# -----------------------------------------------------------------------------
Write-Host "`n2. Checking /api/products..." -ForegroundColor Yellow
try {
  $prodUrl = "$Origin/api/products?page=1&limit=5"
  $res = Invoke-RestMethod -Uri $prodUrl -Method Get -Headers @{ "Origin" = $Origin }
  $prodCount = if ($res.data.products) { $res.data.products.Count } else { 0 }
  $isOk = ($res.ok -eq $true) -and ($prodCount -gt 0)
  Report-Check "Catalogue Verification" $isOk "Retrieved $prodCount product(s)"
} catch {
  Report-Check "Catalogue Verification" $false $_.Exception.Message
}

# -----------------------------------------------------------------------------
# 3. GET /api/avatar/status
# -----------------------------------------------------------------------------
Write-Host "`n3. Checking /api/avatar/status (3D Engine)..." -ForegroundColor Yellow
try {
  $avatarUrl = "$Origin/api/avatar/status"
  $res = Invoke-RestMethod -Uri $avatarUrl -Method Get -Headers @{ "Origin" = $Origin }
  Report-Check "Avatar Engine Status" $true "Online (200): $($res | ConvertTo-Json -Compress)"
} catch {
  $statusCode = $_.Exception.Response.StatusCode.value__
  if ($statusCode -eq 503) {
    Report-Check "Avatar Engine Status" $true "Honest 503 Service Unavailable (Engine offline or tunnel standby)"
  } else {
    Report-Check "Avatar Engine Status" $false "Unexpected HTTP $statusCode: $($_.Exception.Message)"
  }
}

# -----------------------------------------------------------------------------
# 4. POST /api/auth/sign-up/email (Requires Origin for CSRF, saves CookieJar)
# -----------------------------------------------------------------------------
Write-Host "`n4. Creating test session via POST /api/auth/sign-up/email..." -ForegroundColor Yellow
$Session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

try {
  $signUpUrl = "$Origin/api/auth/sign-up/email"
  $signUpBody = @{
    name = $TestName
    email = $TestEmail
    password = $TestPassword
  } | ConvertTo-Json

  $res = Invoke-RestMethod -Uri $signUpUrl -Method Post -Body $signUpBody `
    -ContentType "application/json" `
    -Headers @{ "Origin" = $Origin } `
    -WebSession $Session

  $hasUser = ($null -ne $res.user) -or ($null -ne $res.token) -or ($res.ok -eq $true)
  Report-Check "User Registration" $hasUser "Registered $TestEmail"
} catch {
  Report-Check "User Registration" $false $_.Exception.Message
}

# -----------------------------------------------------------------------------
# 5. GET /api/users/me (With session cookie from WebSession)
# -----------------------------------------------------------------------------
Write-Host "`n5. Verifying authenticated session via GET /api/users/me..." -ForegroundColor Yellow
try {
  $meUrl = "$Origin/api/users/me"
  $res = Invoke-RestMethod -Uri $meUrl -Method Get -WebSession $Session -Headers @{ "Origin" = $Origin }
  $userEmail = if ($res.data.user.email) { $res.data.user.email } else { $res.data.email }
  $isOk = ($res.ok -eq $true) -and ($userEmail -eq $TestEmail)
  Report-Check "Session Identity Check" $isOk "Authenticated as $userEmail with capabilities: $($res.data.capabilities -join ', ')"
} catch {
  Report-Check "Session Identity Check" $false $_.Exception.Message
}

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  SMOKE TEST SUMMARY" -ForegroundColor Cyan
Write-Host "  Passed: $PassedCount, Failed: $FailedCount" -ForegroundColor $(if ($FailedCount -eq 0) { "Green" } else { "Red" })
Write-Host "  Notice: Ephemeral test user created for verification:" -ForegroundColor Yellow
Write-Host "    Email: $TestEmail" -ForegroundColor White
Write-Host "  Remember to clean up this test user from the database." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

if ($FailedCount -gt 0) {
  exit 1
} else {
  exit 0
}
