
$srcPath = "c:\Users\Biradhwaj\Desktop\gridpe\src"
$files = Get-ChildItem -Path $srcPath -Include *.tsx,*.ts -Recurse

$results = @()

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match 'buttonCloseBg' -or $content -match 'Close</span>') {
        $results += $file.FullName
    }
}

$results | ConvertTo-Json
