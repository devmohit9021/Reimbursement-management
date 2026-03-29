# MySQL Root Password Reset Script
# Run this script as Administrator in PowerShell

Write-Host "=== MySQL Root Password Reset ===" -ForegroundColor Cyan

# Step 1: Stop MySQL service
Write-Host "`n[1/5] Stopping MySQL service..." -ForegroundColor Yellow
Stop-Service -Name "MySQL80" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "     MySQL stopped." -ForegroundColor Green

# Step 2: Create the init SQL file
Write-Host "[2/5] Creating password reset SQL file..." -ForegroundColor Yellow
$sqlContent = "ALTER USER 'root'@'localhost' IDENTIFIED BY 'Admin@1234'; FLUSH PRIVILEGES;"
$initFile = "C:\mysql_init.txt"
Set-Content -Path $initFile -Value $sqlContent -Encoding ASCII
Write-Host "     Init file created at $initFile" -ForegroundColor Green

# Step 3: Start MySQL with --init-file to reset password
Write-Host "[3/5] Starting MySQL with init file (this resets the password)..." -ForegroundColor Yellow
$mysqlBin = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
$dataDir = "C:\ProgramData\MySQL\MySQL Server 8.0\Data"
Start-Process -FilePath $mysqlBin -ArgumentList "--init-file=`"$initFile`"", "--console", "--datadir=`"$dataDir`"" -WindowStyle Hidden
Start-Sleep -Seconds 8
Write-Host "     Waiting for MySQL to apply reset..." -ForegroundColor Green

# Step 4: Kill that temporary mysqld process
Write-Host "[4/5] Stopping temporary MySQL process..." -ForegroundColor Yellow
Stop-Process -Name "mysqld" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Host "     Done." -ForegroundColor Green

# Step 5: Restart MySQL service normally
Write-Host "[5/5] Restarting MySQL service normally..." -ForegroundColor Yellow
Start-Service -Name "MySQL80"
Start-Sleep -Seconds 3
Write-Host "     MySQL service started!" -ForegroundColor Green

# Clean up
Remove-Item $initFile -ErrorAction SilentlyContinue

Write-Host "`n=== Password Reset Complete ===" -ForegroundColor Cyan
Write-Host "New root password: Admin@1234" -ForegroundColor Green
Write-Host "Test with: & 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe' -u root -pAdmin@1234 -e 'SELECT 1;'" -ForegroundColor Gray
