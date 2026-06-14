<#
.SYNOPSIS
Backup unused UI components from components/ui directory

.DESCRIPTION
Backup unused UI components to backup/ui-backup directory for recovery if needed

.NOTES
Run: .\backup-ui-components.ps1
Restore: Copy files from backup/ui-backup-* back to components/ui
#>

$sourceDir = "components/ui"
$backupDir = "backup/ui-backup"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDirWithTimestamp = "$backupDir-$timestamp"

$filesToBackup = @(
    "accordion.tsx",
    "alert.tsx",
    "analytics-bento.tsx",
    "breadcrumb.tsx",
    "checkbox.tsx",
    "context-menu.tsx",
    "drawer.tsx",
    "filter-badge.tsx",
    "hover-card.tsx",
    "input-otp.tsx",
    "menubar.tsx",
    "navigation-menu.tsx",
    "progress.tsx",
    "radio-group.tsx",
    "resizable.tsx",
    "scroll-area.tsx",
    "select_shadcn.tsx",
    "slider.tsx",
    "switch.tsx",
    "table.tsx",
    "tabs.tsx",
    "textarea.tsx",
    "dark-mode-toggle.tsx",
    "page-transition.tsx",
    "file-upload.tsx",
    "chart.tsx"
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
Write-Host "To restore: Copy files from $backupDirWithTimestamp back to components/ui"