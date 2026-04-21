$files = Get-ChildItem -Path "c:\Users\Biradhwaj\Desktop\gridpe\src" -Recurse -Filter "*.tsx"

foreach ($f in $files) {
    $allText = Get-Content $f.FullName -Raw
    $missing = @()

    # Check React hooks - must be imported from "react"
    if ($allText -match '[\s=]useState[<(]' -and $allText -notmatch "import\s.*\{[^}]*useState[^}]*\}\s*from\s*[`"']react[`"']") { $missing += "useState(react)" }
    if ($allText -match '[\s=]useEffect\(' -and $allText -notmatch "import\s.*\{[^}]*useEffect[^}]*\}\s*from\s*[`"']react[`"']" -and $allText -notmatch "React\.useEffect") { $missing += "useEffect(react)" }
    if ($allText -match '[\s=]useRef[<(]' -and $allText -notmatch "import\s.*\{[^}]*useRef[^}]*\}\s*from\s*[`"']react[`"']") { $missing += "useRef(react)" }
    if ($allText -match '[\s=]useMemo[<(]' -and $allText -notmatch "import\s.*\{[^}]*useMemo[^}]*\}\s*from\s*[`"']react[`"']") { $missing += "useMemo(react)" }
    if ($allText -match '[\s=]useCallback[<(]' -and $allText -notmatch "import\s.*\{[^}]*useCallback[^}]*\}\s*from\s*[`"']react[`"']") { $missing += "useCallback(react)" }

    # Check router hooks  
    if ($allText -match '[\s=]useNavigate\(' -and $allText -notmatch "import\s.*\{[^}]*useNavigate[^}]*\}\s*from\s*[`"']react-router") { $missing += "useNavigate(react-router-dom)" }
    if ($allText -match '[\s=]useLocation\(' -and $allText -notmatch "import\s.*\{[^}]*useLocation[^}]*\}\s*from\s*[`"']react-router") { $missing += "useLocation(react-router-dom)" }
    if ($allText -match '[\s=]useParams\(' -and $allText -notmatch "import\s.*\{[^}]*useParams[^}]*\}\s*from\s*[`"']react-router") { $missing += "useParams(react-router-dom)" }

    # Check next-themes
    if ($allText -match '[\s=]useTheme\(' -and $allText -notmatch "import\s.*\{[^}]*useTheme[^}]*\}\s*from\s*[`"']next-themes[`"']") { $missing += "useTheme(next-themes)" }

    if ($missing.Count -gt 0) {
        Write-Output ("{0} :: {1}" -f $f.FullName.Replace("c:\Users\Biradhwaj\Desktop\gridpe\src\", ""), ($missing -join ", "))
    }
}
