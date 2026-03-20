# hdlbits — rustlings for Verilog

All **182 HDLBits exercises** in your terminal. No browser needed.
Graded remotely via HDLBits' **Quartus + ModelSim** toolchain.

## Quick Start

```bash
./hdlbits watch    # Start watch mode — just like rustlings
```

That's it. Watch mode shows you the current exercise, waits for you to
edit the `.v` file, auto-submits on save, and advances when you're done.

## How It Works

Every exercise is a single `.v` file with:
- Problem description in `//` comments at the top
- A `// I AM NOT DONE` marker
- Module declaration + starter code

```
exercises/
├── 00_getting_started/step_one.v
├── 01_basics/wire.v
├── 02_vectors/vector0.v
├── ...
└── 19_cs450/cs450_gshare.v
```

**Workflow:**
1. Read the problem (it's right there in the file)
2. Write your Verilog solution
3. Save → auto-graded via HDLBits API (Quartus synthesis + ModelSim sim)
4. When ✅ Success, remove `// I AM NOT DONE` to proceed

## Commands

```
hdlbits watch [name]    Watch mode (auto-submit on save)
hdlbits run <name>      Submit & grade one exercise
hdlbits hint <name>     Show hint
hdlbits open <name>     Open in $EDITOR
hdlbits next            Show next incomplete exercise
hdlbits list [filter]   List exercises with ✓/○ progress
hdlbits verify          Re-grade all completed exercises
hdlbits reset <name>    Reset to starter code
```

## Setup (from scratch)

```bash
python3 scrape_all.py    # Scrape all 182 exercises from hdlbits.01xz.net
python3 generate.py      # Generate exercise .v files
chmod +x hdlbits
./hdlbits watch          # Go!
```

## Grading

Your code is POSTed to `hdlbits.01xz.net/runsim.php` where:
- **Intel Quartus** synthesizes your Verilog
- **ModelSim** simulates against the reference solution
- Result: **Success!** / **Compile Error** / **Incorrect**
