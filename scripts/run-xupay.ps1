# Run XuPay stack (infra + build + run services)
# Place this file at scripts/run-xupay.ps1 and run with PowerShell:  
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run-xupay.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = (Resolve-Path "$(Split-Path -Parent $MyInvocation.MyCommand.Path)\..\")
$root = (Get-Item $root).FullName.TrimEnd('\')
Write-Output "Workspace root: $root"

$logsDir = Join-Path $root 'logs'
if(-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir | Out-Null }

function Run-Command {
    param($cmd,$workingDir)
    Write-Output "==> $cmd (cwd: $workingDir)"
    Push-Location $workingDir
    try {
        iex $cmd
    } finally {
        Pop-Location
    }
}

function Start-ServiceProcess {
    param($name, $workingDir, $wrapperCmd)
    $outLog = Join-Path $logsDir "$name.log"
    $errLog = Join-Path $logsDir "$name.err.log"
    Write-Output "Starting $name (logs: $outLog)"
    $psCmd = "& { Set-Location -Path '$workingDir'; $wrapperCmd }"
    $proc = Start-Process -FilePath powershell -ArgumentList "-NoProfile","-ExecutionPolicy","Bypass","-Command",$psCmd -RedirectStandardOutput $outLog -RedirectStandardError $errLog -WindowStyle Hidden -PassThru
    return $proc
}

function Wait-HttpUp {
    param($url, $timeoutSec=120)
    $deadline = (Get-Date).AddSeconds($timeoutSec)
    while((Get-Date) -lt $deadline){
        try{
            $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
            if($r.StatusCode -eq 200){
                try{ $json = $r.Content | ConvertFrom-Json -ErrorAction SilentlyContinue; if($json.status -and $json.status -eq 'UP'){ Write-Output "$url is UP"; return $true } }catch{}
                Write-Output "$url responded with 200"; return $true
            }
        }catch{
            Write-Output "$($url): $($_.Exception.Message)"
        }
        Start-Sleep -Seconds 2
    }
    return $false
}

# 1) Ensure infra is up with Docker Compose (databases + redis)
Write-Output "Bringing up infra containers..."
Push-Location $root
try{
    & docker compose up -d postgres-user postgres-payment redis | Write-Output
} finally { Pop-Location }

# 2) Build both services using their Maven wrapper
$services = @(
    @{ name='user-service'; path=Join-Path $root 'backend\user-service' },
    @{ name='payment-service'; path=Join-Path $root 'backend\payment-service' }
)

foreach($s in $services){
    Write-Output "Building $($s.name)..."
    Push-Location $s.path
    try{
        if(Test-Path '.\mvnw.cmd'){
            .\mvnw.cmd -q clean package -DskipTests
        } elseif(Test-Path '.\mvnw'){
            .\mvnw -q clean package -DskipTests
        } else {
            mvn -q clean package -DskipTests
        }
    } finally { Pop-Location }
}

# 3) Stop any running service containers so local processes can bind to ports
Write-Output "Stopping existing service containers (if any)..."
try{ & docker rm -f xupay-user-service xupay-payment-service -v -f | Write-Output } catch { }

# 4) Start both services locally using Maven wrapper in background and log output
$procs = @()
foreach($s in $services){
    $wrapper = if(Test-Path (Join-Path $s.path 'mvnw.cmd')){ '.\mvnw.cmd spring-boot:run' } elseif(Test-Path (Join-Path $s.path 'mvnw')){ './mvnw spring-boot:run' } else { 'mvn spring-boot:run' }
    $p = Start-ServiceProcess -name $s.name -workingDir $s.path -wrapperCmd $wrapper
    $procs += @{ name=$s.name; proc=$p }
}

# 5) Wait for health endpoints
$upUser = Wait-HttpUp -url 'http://localhost:8081/actuator/health' -timeoutSec 180
$upPayment = Wait-HttpUp -url 'http://localhost:8082/actuator/health' -timeoutSec 180

if($upUser -and $upPayment){
    Write-Output "✅ Both services are UP. User: http://localhost:8081  Payment: http://localhost:8082"
} else {
    Write-Output "⚠️ One or more services did not report healthy status within timeout. Check logs in $logsDir"
}

# 6) Print tail of logs
Get-ChildItem $logsDir -Filter '*.log' | ForEach-Object { Write-Output "--- Last lines from $($_.Name) ---"; Get-Content $_.FullName -Tail 50 }

Write-Output "Done. You can view logs in $logsDir or open health endpoints."