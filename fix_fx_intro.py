
import os

filepath = r"c:\Users\Biradhwaj\Desktop\gridpe\src\pages\FxIntro.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # Fix broken divs and spacing
    new_line = line.replace("</div >", "</div>").replace("< div", "<div")
    new_lines.append(new_line)

with open(filepath, "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("File cleaned successfully.")
