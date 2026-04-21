
$files = @(
    "c:\Users\Biradhwaj\Desktop\gridpe\src\components\ui\button.tsx",
    "c:\Users\Biradhwaj\Desktop\gridpe\src\components\ui\dialog.tsx",
    "c:\Users\Biradhwaj\Desktop\gridpe\src\components\ui\input-otp.tsx",
    "c:\Users\Biradhwaj\Desktop\gridpe\src\components\ui\input.tsx",
    "c:\Users\Biradhwaj\Desktop\gridpe\src\components\ui\scroll-area.tsx",
    "c:\Users\Biradhwaj\Desktop\gridpe\src\components\ui\switch.tsx",
    "c:\Users\Biradhwaj\Desktop\gridpe\src\components\ui\toast.tsx",
    "c:\Users\Biradhwaj\Desktop\gridpe\src\components\ui\tooltip.tsx",
    "c:\Users\Biradhwaj\Desktop\gridpe\src\components\GlassCalendar.tsx",
    "c:\Users\Biradhwaj\Desktop\gridpe\src\hooks\use-toast.ts",
    "c:\Users\Biradhwaj\Desktop\gridpe\src\labs\LiquidGlassButton.tsx"
)

foreach ($filePath in $files) {
    if (-Not (Test-Path $filePath)) { continue }
    $content = Get-Content $filePath -Raw
    
    # 1. Identity all react import lines
    $lines = $content -split "`r?`n"
    $reactLines = $lines | Where-Object { $_ -match "from\s*['""]react['""]" }
    
    if ($reactLines.Count -le 1) { 
        # Check if it has both default and named in separate lines even if they are just 2 lines
    }

    # 2. Extract components
    $hasDefault = $false
    $hasNamespace = $false
    $namedImports = @()
    
    foreach ($line in $reactLines) {
        if ($line -match "import\s+\*\s+as\s+React") { $hasNamespace = $true; $hasDefault = $true }
        elseif ($line -match "import\s+React\b") { $hasDefault = $true }
        
        if ($line -match "\{(?<terms>[^}]*)\}") {
            $terms = $Matches['terms'] -split ","
            foreach ($term in $terms) {
                $trimmed = $term.Trim()
                if ($trimmed -and $namedImports -notcontains $trimmed) {
                    $namedImports += $trimmed
                }
            }
        }
    }
    
    # 3. Build new import line
    $newImport = "import React"
    if ($namedImports.Count -gt 0) {
        $namedStr = $namedImports -join ", "
        $newImport += ", { $namedStr }"
    }
    $newImport += " from 'react';"
    
    # 4. Replace all react lines with one
    # We'll replace the FIRST react line with the consolidated one, and remove others.
    $firstMatch = $true
    $newLines = @()
    foreach ($line in $lines) {
        if ($line -match "from\s*['""]react['""]") {
            if ($firstMatch) {
                $newLines += $newImport
                $firstMatch = $false
            }
        } else {
            $newLines += $line
        }
    }
    
    $newContent = $newLines -join "`n"
    if ($newContent -ne $content) {
        Write-Host "Consolidating React imports in $filePath"
        Set-Content -Path $filePath -Value $newContent -Encoding UTF8
    }
}
