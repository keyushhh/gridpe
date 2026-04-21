
$srcPath = "c:\Users\Biradhwaj\Desktop\gridpe\src"
$files = Get-ChildItem -Path $srcPath -Include *.tsx,*.ts -Recurse

$results = @()

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Matches multiple imports from 'react'
    $reactImportMatches = [regex]::Matches($content, 'import\b.*?from\s*[''"]react[''"]')
    
    if ($reactImportMatches.Count -gt 1) {
        $results += @{
            File = $file.FullName
            MatchCount = $reactImportMatches.Count
        }
    }
}

$results | ConvertTo-Json
