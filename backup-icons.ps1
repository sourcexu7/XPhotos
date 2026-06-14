<#
.SYNOPSIS
Backup unused icon components

.DESCRIPTION
Backup unused icon components to backup/icons-backup directory for recovery if needed

.NOTES
Run: .\backup-icons.ps1
Restore: Copy files from backup/icons-backup-* back to components/icons
#>

$sourceDir = "components/icons"
$backupDir = "backup/icons-backup"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDirWithTimestamp = "$backupDir-$timestamp"

$filesToBackup = @(
    "arrow-right.tsx",
    "circle-chevron-down.tsx",
    "circle-help.tsx",
    "fingerprint.tsx",
    "key-circle.tsx",
    "key-square.tsx",
    "refresh-ccw.tsx",
    "rocket.tsx"
)

if (-not (Test-Path $backupDirWithTimestamp)) {
    New-Item -ItemType Directory -Path $backupDirWithTimestamp | Out-Null
    Write-Host "Created backup directory: $backupDirWithTimestamp"
}

$backupCount = 0
foreach ($file in $filesToBackup) {
    $sourcePath = Join-Path $sourceDir $file
    if (Test-Path $sourcePath) {
        $destinationPath = Join-Path $backupDirWithTimestamp $file
        Copy-Item -Path $sourcePath -Destination $destinationPath -Force
        Write-Host "Backed up: $file"
        $backupCount++
    } else {
        Write-Host "File not found, skipped: $file"
    }
}

Write-Host ""
Write-Host "Backup completed! Backed up $backupCount files"
Write-Host "Backup directory: $backupDirWithTimestamp"
Write-Host ""
Write-Host "To restore: Copy files from $backupDirWithTimestamp back to components/icons"