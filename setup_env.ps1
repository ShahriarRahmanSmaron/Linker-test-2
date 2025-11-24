$pythonPath = "C:\Users\shahriar_rnd\miniconda"
$pythonScriptsPath = "C:\Users\shahriar_rnd\miniconda\Scripts"
$nodePath = "C:\Users\shahriar_rnd\Tools\nodejs\node-v24.11.0-win-x64"

$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$pathParts = $currentPath -split ";"
$changed = $false

if ($pathParts -notcontains $pythonPath) {
    $currentPath = "$pythonPath;$currentPath"
    Write-Host "Adding Python to PATH..."
    $changed = $true
} else {
    Write-Host "Python is already in PATH."
}

if ($pathParts -notcontains $pythonScriptsPath) {
    $currentPath = "$pythonScriptsPath;$currentPath"
    Write-Host "Adding Python Scripts to PATH..."
    $changed = $true
} else {
    Write-Host "Python Scripts is already in PATH."
}

if ($pathParts -notcontains $nodePath) {
    $currentPath = "$nodePath;$currentPath"
    Write-Host "Adding Node.js to PATH..."
    $changed = $true
} else {
    Write-Host "Node.js is already in PATH."
}

if ($changed) {
    [Environment]::SetEnvironmentVariable("Path", $currentPath, "User")
    Write-Host "Environment variables updated successfully."
    Write-Host "IMPORTANT: You must restart your terminal (and VS Code) for these changes to take effect."
} else {
    Write-Host "No changes needed."
}
