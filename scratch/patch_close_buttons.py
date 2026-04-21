
import os
import re

files_to_patch = [
    r"c:\Users\Biradhwaj\Desktop\gridpe\src\pages\Banking.tsx",
    r"c:\Users\Biradhwaj\Desktop\gridpe\src\pages\OrderCashSummary.tsx",
    r"c:\Users\Biradhwaj\Desktop\gridpe\src\pages\MyCards.tsx",
    r"c:\Users\Biradhwaj\Desktop\gridpe\src\pages\FxExchangeSummary.tsx",
    r"c:\Users\Biradhwaj\Desktop\gridpe\src\pages\KYCIntro.tsx",
    r"c:\Users\Biradhwaj\Desktop\gridpe\src\pages\MpinSettings.tsx",
    r"c:\Users\Biradhwaj\Desktop\gridpe\src\components\OrderDetailsSheet.tsx"
]

# Pattern to find the Close button. 
# It looks for a button that contains "Close" and likely has buttonCloseBg or similar styles.
# We want to capture the onClick handler.
button_pattern = re.compile(r'<button\s+onClick=\{([^}]+)\}\s+className=\{`([^`]+)`\}\s+style=\{([^}]+)\}\s*>\s*<X[^>]*/>\s*<span[^>]*>Close</span>\s*</button>', re.DOTALL)

# Alternative pattern for buttons with individual class/style attributes or different nesting
button_pattern_alt = re.compile(r'<button\s+onClick=\{([^}]+)\}\s+className=\{([^}]+)\}\s+style=\{([^}]+)\}\s*>\s*<X[^>]*/>\s*<span[^>]*>Close</span>\s*</button>', re.DOTALL)

# Standardized replacement template
template = r'''<button
                        onClick={\1}
                        className={cn(
                            "relative z-10 mt-6 px-8 h-[36px] rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform overflow-hidden",
                            isDarkMode ? "glass-container glass-physics-clear grow-0" : "bg-black"
                        )}
                        style={{
                            '--glass-specular-intensity': '0.2'
                        } as any}
                    >
                        {isDarkMode && (
                            <>
                                <div className="glass-lens" />
                                <div className="absolute inset-0 z-[1] pointer-events-none" style={{ backgroundColor: 'var(--glass-tint)' }} />
                                <span className="glass-rim-v2" />
                            </>
                        )}
                        <X className="w-4 h-4 text-white relative z-10" />
                        <span className="text-white text-[14px] font-sans relative z-10">Close</span>
                    </button>'''

def patch_file(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Check for 'cn' import and add if missing
    if 'import { cn }' not in content and 'import {cn}' not in content:
        # Insert after the last import
        import_match = re.search(r'import\s+.*?;(?!.*import)', content, re.DOTALL)
        if import_match:
            pos = import_match.end()
            content = content[:pos] + '\nimport { cn } from "@/lib/utils";' + content[pos:]

    # 2. Replace the button using regex
    # We use a more flexible regex that captures the onClick action \1
    
    # Try pattern 1
    new_content = re.sub(r'<button\b[^>]*?onClick=\{([^}]+)\}[^>]*?>\s*<X[^>]*?/>\s*<span[^>]*?>Close</span>\s*</button>', template, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Patched {file_path}")
    else:
        print(f"No match found in {file_path}")

for f in files_to_patch:
    patch_file(f)
