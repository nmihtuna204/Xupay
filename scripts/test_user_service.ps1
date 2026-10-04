$base='http://localhost:8081'
$email = "test.$(Get-Random)@example.com"
$body = @{ 
  email = $email
  password = 'P@ssword123'
  firstName = 'Auto'
  lastName = 'User'
  phone = "+84901$(Get-Random -Minimum 100000 -Maximum 999999)"  # unique column: a fixed number broke every run after the first
} | ConvertTo-Json

Write-Output "Registering as $email"
try {
  $resp = Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop
  Write-Output 'Register response:'
  $resp | ConvertTo-Json -Compress
} catch {
  Write-Output 'Register failed, trying login...'
  $loginBody = @{ email=$email; password='P@ssword123' } | ConvertTo-Json
  try {
    $resp = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -Body $loginBody -ContentType 'application/json' -ErrorAction Stop
    Write-Output 'Login response:'
    $resp | ConvertTo-Json -Compress
  } catch {
    Write-Output 'Register and login both failed:'
    Write-Output $_.Exception.ToString()
    exit 2
  }
}

# support multiple token field names
$token = $resp.accessToken; if (-not $token) { $token = $resp.token }
if (-not $token) { $token = $resp.access_token }
if (-not $token) { Write-Output 'No token returned in response object keys: accessToken, token, access_token'; Write-Output (ConvertTo-Json $resp -Compress); exit 3 }

Write-Output 'TOKEN:'
Write-Output $token
Write-Output 'Get /api/users/me/profile:'
try {
  $profile = Invoke-RestMethod -Uri "$base/api/users/me/profile" -Method Get -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
  $profile | ConvertTo-Json -Compress
} catch {
  Write-Output 'Failed to call profile endpoint:'
  Write-Output $_.Exception.ToString()
  exit 4
}
