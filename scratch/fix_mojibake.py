
import os

files_to_fix = [
    r"c:\Users\Biradhwaj\Desktop\gridpe\src\pages\KYCIntro.tsx",
    r"c:\Users\Biradhwaj\Desktop\gridpe\src\pages\ForgotMpin.tsx",
    r"c:\Users\Biradhwaj\Desktop\gridpe\src\pages\OrderCashSummary.tsx",
    r"c:\Users\Biradhwaj\Desktop\gridpe\src\pages\FxExchangeSummary.tsx",
]

replacements = {
    "â€¢": "•", # Corrupted bullet points
    "ðŸ’™": "💙", # Restore the blue heart (don't turn it into a bullet)
}

def fix_file(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    for corrupted, fixed in replacements.items():
        content = content.replace(corrupted, fixed)

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed mojibake in {file_path}")
    else:
        print(f"No mojibake found in {file_path}")

for f in files_to_fix:
    fix_file(f)
