<#
.SYNOPSIS
Backup unused origin UI components

.DESCRIPTION
Backup unused origin components to backup/origin-backup directory for recovery if needed

.NOTES
Run: .\backup-origin-components.ps1
Restore: Copy files from backup/origin-backup-* back to components/ui/origin
#>

$sourceDir = "components/ui/origin"
$backupDir = "backup/origin-backup"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDirWithTimestamp = "$backupDir-$timestamp"

$filesToBackup = @(
    "evervault-card.tsx",
    "multiselect.tsx",
    "text-counter.tsx"
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
Write-Host "To restore: Copy files from $backupDirWithTimestamp back to components/ui/origin"