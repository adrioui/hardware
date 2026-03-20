#!/usr/bin/env python3
"""Generate rustlings-style exercise .v files from exercises.json"""

import json, os, textwrap

EXERCISES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "exercises")

CATEGORY_NAMES = {
    "00_getting_started": "Getting Started",
    "01_basics": "Verilog Language › Basics",
    "02_vectors": "Verilog Language › Vectors",
    "03_modules": "Verilog Language › Modules",
    "04_procedures": "Verilog Language › Procedures",
    "05_more_features": "Verilog Language › More Features",
    "06_comb_basic_gates": "Circuits › Combinational › Basic Gates",
    "07_comb_mux": "Circuits › Combinational › Multiplexers",
    "08_comb_arith": "Circuits › Combinational › Arithmetic",
    "09_comb_karnaugh": "Circuits › Combinational › Karnaugh Maps",
    "10_seq_flipflops": "Circuits › Sequential › Flip-Flops",
    "11_seq_counters": "Circuits › Sequential › Counters",
    "12_seq_shift_reg": "Circuits › Sequential › Shift Registers",
    "13_seq_more": "Circuits › Sequential › More Circuits",
    "14_seq_fsm": "Circuits › Sequential › Finite State Machines",
    "15_building_larger": "Circuits › Building Larger Circuits",
    "16_bugs": "Verification › Finding Bugs",
    "17_sim_waveforms": "Verification › Simulation Waveforms",
    "18_testbenches": "Verification › Writing Testbenches",
    "19_cs450": "CS450",
}


def wrap_comment(text, width=76):
    """Wrap text as Verilog // comments."""
    lines = []
    for para in text.split('\n'):
        para = para.strip()
        if not para:
            lines.append("//")
            continue
        # Preserve indentation for code-like lines
        if para.startswith('    ') or para.startswith('`') or para.startswith('•'):
            lines.append(f"// {para}")
            continue
        wrapped = textwrap.wrap(para, width=width)
        for w in wrapped:
            lines.append(f"// {w}")
    return '\n'.join(lines)


def generate_exercise(ex):
    """Generate a single .v file content for an exercise."""
    parts = []

    # Header
    parts.append(f"// {'=' * 74}")
    parts.append(f"// HDLBits — {ex['title']}")
    parts.append(f"// {ex['url']}")
    parts.append(f"// {'=' * 74}")
    parts.append("//")

    # Description
    if ex['desc']:
        parts.append(wrap_comment(ex['desc']))
    parts.append("//")

    # Hint
    if ex.get('hint'):
        parts.append(f"// {'─' * 74}")
        parts.append("// HINT:")
        parts.append(wrap_comment(ex['hint']))

    parts.append(f"// {'─' * 74}")
    parts.append("")

    # I AM NOT DONE marker
    parts.append("// I AM NOT DONE")
    parts.append("")

    # Module declaration + starter code
    module_decl = ex.get('module_decl', 'module top_module();')
    starter = ex.get('starter', '')
    textarea = ex.get('textarea', '')

    # Build the code body
    # If textarea already has a complete module, use it
    if textarea and 'endmodule' in textarea:
        # Merge with module_decl if textarea has a generic declaration
        if 'module top_module(' in textarea and module_decl != 'module top_module();':
            # Replace the textarea's module line with the proper declaration
            code = textarea
            # Try to replace generic module line
            code_lines = code.split('\n')
            # Find where module declaration starts and ends
            mod_start = -1
            mod_end = -1
            for i, line in enumerate(code_lines):
                if 'module top_module' in line:
                    mod_start = i
                if mod_start >= 0 and ');' in line:
                    mod_end = i
                    break
            if mod_start >= 0 and mod_end >= 0:
                # Replace the module declaration
                new_lines = code_lines[:mod_start]
                new_lines.append(module_decl)
                if starter:
                    new_lines.append(starter)
                new_lines.extend(code_lines[mod_end+1:])
                code = '\n'.join(new_lines)
            parts.append(code)
        else:
            parts.append(textarea)
    else:
        # Build from module_decl + starter
        parts.append(module_decl)
        if starter:
            parts.append(starter)
        parts.append("")
        parts.append("endmodule")

    parts.append("")
    return '\n'.join(parts)


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, "exercises.json")

    with open(json_path) as f:
        exercises = json.load(f)

    # Clean exercises dir
    if os.path.exists(EXERCISES_DIR):
        import shutil
        shutil.rmtree(EXERCISES_DIR)

    # Generate files
    manifest_lines = []
    for ex in exercises:
        cat_dir = os.path.join(EXERCISES_DIR, ex['category'])
        os.makedirs(cat_dir, exist_ok=True)

        filename = f"{ex['slug']}.v"
        filepath = os.path.join(cat_dir, filename)

        content = generate_exercise(ex)
        with open(filepath, 'w') as f:
            f.write(content)

        # manifest: index|slug|tc|category|title|relative_path
        relpath = os.path.join(ex['category'], filename)
        manifest_lines.append(
            f"{ex['index']}|{ex['slug']}|{ex['tc']}|{ex['category']}|{ex['title']}|{relpath}"
        )

    # Write manifest
    manifest_path = os.path.join(script_dir, ".manifest")
    with open(manifest_path, 'w') as f:
        f.write('\n'.join(manifest_lines) + '\n')

    # Write category names for the CLI
    cat_path = os.path.join(script_dir, ".categories")
    with open(cat_path, 'w') as f:
        for k, v in CATEGORY_NAMES.items():
            f.write(f"{k}|{v}\n")

    print(f"✓ Generated {len(exercises)} exercise files in exercises/")
    print(f"✓ Wrote .manifest ({len(manifest_lines)} entries)")

    # Quick stats
    cats = {}
    for ex in exercises:
        cats.setdefault(ex['category'], []).append(ex['slug'])
    print()
    for cat in sorted(cats):
        name = CATEGORY_NAMES.get(cat, cat)
        print(f"  {name:50s} {len(cats[cat]):3d}")


if __name__ == "__main__":
    main()
