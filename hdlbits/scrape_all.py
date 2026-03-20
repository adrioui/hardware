#!/usr/bin/env python3
"""Scrape every HDLBits exercise page into exercises.json"""

import json, re, time, sys, html
from urllib.request import urlopen, Request
from urllib.error import URLError

BASE = "https://hdlbits.01xz.net"

# ── Full ordered exercise catalog ──────────────────────────────────
# (slug, tc_api_path, category_path, title)
EXERCISES = [
    # Getting Started
    ("step_one", "step_one", "00_getting_started", "Getting Started"),
    ("zero", "zero", "00_getting_started", "Output Zero"),

    # Verilog Language > Basics
    ("wire", "wire", "01_basics", "Simple wire"),
    ("wire4", "wire4", "01_basics", "Four wires"),
    ("notgate", "notgate", "01_basics", "Inverter"),
    ("andgate", "andgate", "01_basics", "AND gate"),
    ("norgate", "norgate", "01_basics", "NOR gate"),
    ("xnorgate", "xnorgate", "01_basics", "XNOR gate"),
    ("wire_decl", "wire_decl", "01_basics", "Declaring wires"),
    ("7458", "7458", "01_basics", "7458 chip"),

    # Verilog Language > Vectors
    ("vector0", "vector0", "02_vectors", "Vectors"),
    ("vector1", "vector1", "02_vectors", "Vectors in more detail"),
    ("vector2", "vector2", "02_vectors", "Vector part select"),
    ("vectorgates", "vectorgates", "02_vectors", "Bitwise operators"),
    ("gates4", "gates4", "02_vectors", "Four-input gates"),
    ("vector3", "vector3", "02_vectors", "Vector concatenation operator"),
    ("vectorr", "vectorr", "02_vectors", "Vector reversal 1"),
    ("vector4", "vector4", "02_vectors", "Replication operator"),
    ("vector5", "vector5", "02_vectors", "More replication"),

    # Verilog Language > Modules: Hierarchy
    ("module", "module", "03_modules", "Modules"),
    ("module_pos", "module_pos", "03_modules", "Connecting ports by position"),
    ("module_name", "module_name", "03_modules", "Connecting ports by name"),
    ("module_shift", "module_shift", "03_modules", "Three modules"),
    ("module_shift8", "module_shift8", "03_modules", "Modules and vectors"),
    ("module_add", "module_add", "03_modules", "Adder 1"),
    ("module_fadd", "module_fadd", "03_modules", "Adder 2"),
    ("module_cseladd", "module_cseladd", "03_modules", "Carry-select adder"),
    ("module_addsub", "module_addsub", "03_modules", "Adder-subtractor"),

    # Verilog Language > Procedures
    ("alwaysblock1", "alwaysblock1", "04_procedures", "Always blocks (combinational)"),
    ("alwaysblock2", "alwaysblock2", "04_procedures", "Always blocks (clocked)"),
    ("always_if", "always_if", "04_procedures", "If statement"),
    ("always_if2", "always_if2", "04_procedures", "If statement latches"),
    ("always_case", "always_case", "04_procedures", "Case statement"),
    ("always_case2", "always_case2", "04_procedures", "Priority encoder"),
    ("always_casez", "always_casez", "04_procedures", "Priority encoder with casez"),
    ("always_nolatches", "always_nolatches", "04_procedures", "Avoiding latches"),

    # Verilog Language > More Verilog Features
    ("conditional", "conditional", "05_more_features", "Conditional ternary operator"),
    ("reduction", "reduction", "05_more_features", "Reduction operators"),
    ("gates100", "gates100", "05_more_features", "Reduction: Even wider gates"),
    ("vector100r", "vector100r", "05_more_features", "Combinational for-loop: Vector reversal 2"),
    ("popcount255", "popcount255", "05_more_features", "Combinational for-loop: 255-bit population count"),
    ("adder100i", "adder100i", "05_more_features", "Generate for-loop: 100-bit binary adder 2"),
    ("bcdadd100", "bcdadd100", "05_more_features", "Generate for-loop: 100-digit BCD adder"),

    # Circuits > Combinational Logic > Basic Gates
    ("m2014_q4h", "exams/m2014_q4h", "06_comb_basic_gates", "Wire"),
    ("m2014_q4i", "exams/m2014_q4i", "06_comb_basic_gates", "GND"),
    ("m2014_q4e", "exams/m2014_q4e", "06_comb_basic_gates", "NOR"),
    ("m2014_q4f", "exams/m2014_q4f", "06_comb_basic_gates", "Another gate"),
    ("m2014_q4g", "exams/m2014_q4g", "06_comb_basic_gates", "Two gates"),
    ("gates", "gates", "06_comb_basic_gates", "More logic gates"),
    ("7420", "7420", "06_comb_basic_gates", "7420 chip"),
    ("truthtable1", "truthtable1", "06_comb_basic_gates", "Truth tables"),
    ("mt2015_eq2", "mt2015_eq2", "06_comb_basic_gates", "Two-bit equality"),
    ("mt2015_q4a", "mt2015_q4a", "06_comb_basic_gates", "Simple circuit A"),
    ("mt2015_q4b", "mt2015_q4b", "06_comb_basic_gates", "Simple circuit B"),
    ("mt2015_q4", "mt2015_q4", "06_comb_basic_gates", "Combine circuits A and B"),
    ("ringer", "ringer", "06_comb_basic_gates", "Ring or vibrate?"),
    ("thermostat", "thermostat", "06_comb_basic_gates", "Thermostat"),
    ("popcount3", "popcount3", "06_comb_basic_gates", "3-bit population count"),
    ("gatesv", "gatesv", "06_comb_basic_gates", "Gates and vectors"),
    ("gatesv100", "gatesv100", "06_comb_basic_gates", "Even longer vectors"),

    # Circuits > Combinational Logic > Multiplexers
    ("mux2to1", "mux2to1", "07_comb_mux", "2-to-1 multiplexer"),
    ("mux2to1v", "mux2to1v", "07_comb_mux", "2-to-1 bus multiplexer"),
    ("mux9to1v", "mux9to1v", "07_comb_mux", "9-to-1 multiplexer"),
    ("mux256to1", "mux256to1", "07_comb_mux", "256-to-1 multiplexer"),
    ("mux256to1v", "mux256to1v", "07_comb_mux", "256-to-1 4-bit multiplexer"),

    # Circuits > Combinational Logic > Arithmetic
    ("hadd", "hadd", "08_comb_arith", "Half adder"),
    ("fadd", "fadd", "08_comb_arith", "Full adder"),
    ("adder3", "adder3", "08_comb_arith", "3-bit binary adder"),
    ("m2014_q4j", "exams/m2014_q4j", "08_comb_arith", "Adder"),
    ("ece241_2014_q1c", "exams/ece241_2014_q1c", "08_comb_arith", "Signed addition overflow"),
    ("adder100", "adder100", "08_comb_arith", "100-bit binary adder"),
    ("bcdadd4", "bcdadd4", "08_comb_arith", "4-digit BCD adder"),

    # Circuits > Combinational Logic > Karnaugh Map
    ("kmap1", "kmap1", "09_comb_karnaugh", "3-variable"),
    ("kmap2", "kmap2", "09_comb_karnaugh", "4-variable"),
    ("kmap3", "kmap3", "09_comb_karnaugh", "4-variable (2)"),
    ("kmap4", "kmap4", "09_comb_karnaugh", "4-variable (3)"),
    ("ece241_2013_q2", "exams/ece241_2013_q2", "09_comb_karnaugh", "Minimum SOP and POS"),
    ("m2014_q3", "exams/m2014_q3", "09_comb_karnaugh", "Karnaugh map"),
    ("2012_q1g", "exams/2012_q1g", "09_comb_karnaugh", "Karnaugh map (2)"),
    ("ece241_2014_q3", "exams/ece241_2014_q3", "09_comb_karnaugh", "K-map implemented with a multiplexer"),

    # Circuits > Sequential Logic > Latches and Flip-Flops
    ("dff", "dff", "10_seq_flipflops", "D flip-flop"),
    ("dff8", "dff8", "10_seq_flipflops", "D flip-flops"),
    ("dff8r", "dff8r", "10_seq_flipflops", "DFF with reset"),
    ("dff8p", "dff8p", "10_seq_flipflops", "DFF with reset value"),
    ("dff8ar", "dff8ar", "10_seq_flipflops", "DFF with asynchronous reset"),
    ("dff16e", "dff16e", "10_seq_flipflops", "DFF with byte enable"),
    ("m2014_q4a", "exams/m2014_q4a", "10_seq_flipflops", "D Latch"),
    ("m2014_q4b", "exams/m2014_q4b", "10_seq_flipflops", "DFF (exam)"),
    ("m2014_q4c", "exams/m2014_q4c", "10_seq_flipflops", "DFF (exam 2)"),
    ("m2014_q4d", "exams/m2014_q4d", "10_seq_flipflops", "DFF+gate"),
    ("mt2015_muxdff", "mt2015_muxdff", "10_seq_flipflops", "Mux and DFF"),
    ("2014_q4a", "exams/2014_q4a", "10_seq_flipflops", "Mux and DFF (exam)"),
    ("ece241_2014_q4", "exams/ece241_2014_q4", "10_seq_flipflops", "DFFs and gates"),
    ("ece241_2013_q7", "exams/ece241_2013_q7", "10_seq_flipflops", "Create circuit from truth table"),
    ("edgedetect", "edgedetect", "10_seq_flipflops", "Detect an edge"),
    ("edgedetect2", "edgedetect2", "10_seq_flipflops", "Detect both edges"),
    ("edgecapture", "edgecapture", "10_seq_flipflops", "Edge capture register"),
    ("dualedge", "dualedge", "10_seq_flipflops", "Dual-edge triggered flip-flop"),

    # Circuits > Sequential Logic > Counters
    ("count15", "count15", "11_seq_counters", "Four-bit binary counter"),
    ("count10", "count10", "11_seq_counters", "Decade counter"),
    ("count1to10", "count1to10", "11_seq_counters", "Decade counter again"),
    ("countslow", "countslow", "11_seq_counters", "Slow decade counter"),
    ("ece241_2014_q7a", "exams/ece241_2014_q7a", "11_seq_counters", "Counter 1-12"),
    ("ece241_2014_q7b", "exams/ece241_2014_q7b", "11_seq_counters", "Counter 1000"),
    ("countbcd", "countbcd", "11_seq_counters", "4-digit decimal counter"),
    ("count_clock", "count_clock", "11_seq_counters", "12-hour clock"),

    # Circuits > Sequential Logic > Shift Registers
    ("shift4", "shift4", "12_seq_shift_reg", "4-bit shift register"),
    ("rotate100", "rotate100", "12_seq_shift_reg", "Left/right rotator"),
    ("shift18", "shift18", "12_seq_shift_reg", "Left/right arithmetic shift by 1 or 8"),
    ("lfsr5", "lfsr5", "12_seq_shift_reg", "5-bit LFSR"),
    ("mt2015_lfsr", "mt2015_lfsr", "12_seq_shift_reg", "3-bit LFSR"),
    ("lfsr32", "lfsr32", "12_seq_shift_reg", "32-bit LFSR"),
    ("m2014_q4k", "exams/m2014_q4k", "12_seq_shift_reg", "Shift register"),
    ("2014_q4b", "exams/2014_q4b", "12_seq_shift_reg", "Shift register (exam)"),
    ("ece241_2013_q12", "exams/ece241_2013_q12", "12_seq_shift_reg", "3-input LUT"),

    # Circuits > Sequential Logic > More Circuits
    ("rule90", "rule90", "13_seq_more", "Rule 90"),
    ("rule110", "rule110", "13_seq_more", "Rule 110"),
    ("conwaylife", "conwaylife", "13_seq_more", "Conway's Game of Life 16x16"),

    # Circuits > Sequential Logic > Finite State Machines
    ("fsm1", "fsm1", "14_seq_fsm", "Simple FSM 1 (asynchronous reset)"),
    ("fsm1s", "fsm1s", "14_seq_fsm", "Simple FSM 1 (synchronous reset)"),
    ("fsm2", "fsm2", "14_seq_fsm", "Simple FSM 2 (asynchronous reset)"),
    ("fsm2s", "fsm2s", "14_seq_fsm", "Simple FSM 2 (synchronous reset)"),
    ("fsm3comb", "fsm3comb", "14_seq_fsm", "Simple state transitions 3"),
    ("fsm3onehot", "fsm3onehot", "14_seq_fsm", "Simple one-hot state transitions 3"),
    ("fsm3", "fsm3", "14_seq_fsm", "Simple FSM 3 (asynchronous reset)"),
    ("fsm3s", "fsm3s", "14_seq_fsm", "Simple FSM 3 (synchronous reset)"),
    ("ece241_2013_q4", "exams/ece241_2013_q4", "14_seq_fsm", "Design a Moore FSM"),
    ("lemmings1", "lemmings1", "14_seq_fsm", "Lemmings 1"),
    ("lemmings2", "lemmings2", "14_seq_fsm", "Lemmings 2"),
    ("lemmings3", "lemmings3", "14_seq_fsm", "Lemmings 3"),
    ("lemmings4", "lemmings4", "14_seq_fsm", "Lemmings 4"),
    ("fsm_onehot", "fsm_onehot", "14_seq_fsm", "One-hot FSM"),
    ("fsm_ps2", "fsm_ps2", "14_seq_fsm", "PS/2 packet parser"),
    ("fsm_ps2data", "fsm_ps2data", "14_seq_fsm", "PS/2 packet parser and datapath"),
    ("fsm_serial", "fsm_serial", "14_seq_fsm", "Serial receiver"),
    ("fsm_serialdata", "fsm_serialdata", "14_seq_fsm", "Serial receiver and datapath"),
    ("fsm_serialdp", "fsm_serialdp", "14_seq_fsm", "Serial receiver with parity checking"),
    ("fsm_hdlc", "fsm_hdlc", "14_seq_fsm", "Sequence recognition"),
    ("ece241_2013_q8", "exams/ece241_2013_q8", "14_seq_fsm", "Q8: Design a Mealy FSM"),
    ("ece241_2014_q5a", "exams/ece241_2014_q5a", "14_seq_fsm", "Q5a: Serial two's complementer (Moore FSM)"),
    ("ece241_2014_q5b", "exams/ece241_2014_q5b", "14_seq_fsm", "Q5b: Serial two's complementer (Mealy FSM)"),
    ("2014_q3fsm", "exams/2014_q3fsm", "14_seq_fsm", "Q3a: FSM"),
    ("2014_q3bfsm", "exams/2014_q3bfsm", "14_seq_fsm", "Q3b: FSM"),
    ("2014_q3c", "exams/2014_q3c", "14_seq_fsm", "Q3c: FSM logic"),
    ("m2014_q6b", "exams/m2014_q6b", "14_seq_fsm", "Q6b: FSM next-state logic"),
    ("m2014_q6c", "exams/m2014_q6c", "14_seq_fsm", "Q6c: FSM one-hot next-state logic"),
    ("m2014_q6", "exams/m2014_q6", "14_seq_fsm", "Q6: FSM"),
    ("2012_q2fsm", "exams/2012_q2fsm", "14_seq_fsm", "Q2a: FSM"),
    ("2012_q2b", "exams/2012_q2b", "14_seq_fsm", "Q2b: One-hot FSM equations"),
    ("2013_q2afsm", "exams/2013_q2afsm", "14_seq_fsm", "Q2a: FSM (2013)"),
    ("2013_q2bfsm", "exams/2013_q2bfsm", "14_seq_fsm", "Q2b: Another FSM"),

    # Circuits > Building Larger Circuits
    ("review2015_count1k", "exams/review2015_count1k", "15_building_larger", "Counter with period 1000"),
    ("review2015_shiftcount", "exams/review2015_shiftcount", "15_building_larger", "4-bit shift register and down counter"),
    ("review2015_fsmseq", "exams/review2015_fsmseq", "15_building_larger", "FSM: Sequence 1101 recognizer"),
    ("review2015_fsmshift", "exams/review2015_fsmshift", "15_building_larger", "FSM: Enable shift register"),
    ("review2015_fsm", "exams/review2015_fsm", "15_building_larger", "FSM: The complete FSM"),
    ("review2015_fancytimer", "exams/review2015_fancytimer", "15_building_larger", "The complete timer"),
    ("review2015_fsmonehot", "exams/review2015_fsmonehot", "15_building_larger", "FSM: One-hot logic equations"),

    # Verification: Reading Simulations > Finding bugs
    ("bugs_mux2", "bugs_mux2", "16_bugs", "Mux"),
    ("bugs_nand3", "bugs_nand3", "16_bugs", "NAND"),
    ("bugs_mux4", "bugs_mux4", "16_bugs", "Mux (4-to-1)"),
    ("bugs_addsubz", "bugs_addsubz", "16_bugs", "Add/sub"),
    ("bugs_case", "bugs_case", "16_bugs", "Case statement"),

    # Verification: Reading Simulations > Waveforms
    ("sim_circuit1", "sim/circuit1", "17_sim_waveforms", "Combinational circuit 1"),
    ("sim_circuit2", "sim/circuit2", "17_sim_waveforms", "Combinational circuit 2"),
    ("sim_circuit3", "sim/circuit3", "17_sim_waveforms", "Combinational circuit 3"),
    ("sim_circuit4", "sim/circuit4", "17_sim_waveforms", "Combinational circuit 4"),
    ("sim_circuit5", "sim/circuit5", "17_sim_waveforms", "Combinational circuit 5"),
    ("sim_circuit6", "sim/circuit6", "17_sim_waveforms", "Combinational circuit 6"),
    ("sim_circuit7", "sim/circuit7", "17_sim_waveforms", "Sequential circuit 7"),
    ("sim_circuit8", "sim/circuit8", "17_sim_waveforms", "Sequential circuit 8"),
    ("sim_circuit9", "sim/circuit9", "17_sim_waveforms", "Sequential circuit 9"),
    ("sim_circuit10", "sim/circuit10", "17_sim_waveforms", "Sequential circuit 10"),

    # Verification: Writing Testbenches
    ("tb_clock", "tb/clock", "18_testbenches", "Clock"),
    ("tb_tb1", "tb/tb1", "18_testbenches", "Testbench1"),
    ("tb_and", "tb/and", "18_testbenches", "AND gate"),
    ("tb_tb2", "tb/tb2", "18_testbenches", "Testbench2"),
    ("tb_tff", "tb/tff", "18_testbenches", "T flip-flop"),

    # CS450
    ("cs450_timer", "cs450/timer", "19_cs450", "Timer"),
    ("cs450_counter_2bc", "cs450/counter_2bc", "19_cs450", "2-bit counter"),
    ("cs450_history_shift", "cs450/history_shift", "19_cs450", "History shift register"),
    ("cs450_gshare", "cs450/gshare", "19_cs450", "Gshare branch predictor"),
]


def decode_html(s):
    """Decode HTML entities and strip tags."""
    s = html.unescape(s)
    # Replace <br>, <br/>, </p>, </li> with newline
    s = re.sub(r'<br\s*/?>|</p>|</li>|</pre>', '\n', s)
    # Replace <p> with newline
    s = re.sub(r'<p[^>]*>', '\n', s)
    # Replace <li> with bullet
    s = re.sub(r'<li[^>]*>', '  • ', s)
    # Replace <pre> with newline
    s = re.sub(r'<pre[^>]*>', '\n    ', s)
    # Replace <b> / <i> / <tt> / <code>
    s = re.sub(r'<b>(.*?)</b>', r'**\1**', s)
    s = re.sub(r'<i>(.*?)</i>', r'*\1*', s)
    s = re.sub(r'<tt>(.*?)</tt>', r'`\1`', s)
    s = re.sub(r'<code>(.*?)</code>', r'`\1`', s)
    # Strip remaining tags
    s = re.sub(r'<[^>]+>', '', s)
    # Collapse multiple blank lines
    s = re.sub(r'\n{3,}', '\n\n', s)
    return s.strip()


def fetch(url, retries=1):
    for i in range(retries + 1):
        try:
            req = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urlopen(req, timeout=10) as resp:
                return resp.read().decode('utf-8', errors='replace')
        except (URLError, Exception) as e:
            if i < retries:
                time.sleep(1)
            else:
                print(f"  FAILED: {url} ({e})", file=sys.stderr)
                return None


def extract(page_html):
    """Extract description, module_decl, starter_code, hint from a page."""
    result = {"desc": "", "module_decl": "", "starter": "", "hint": ""}

    # ── Description: content between nav-bar and portlistbox/submitbox ──
    # Find the main body content
    body_match = re.search(
        r'<div id="bodyContent".*?>(.*?)(?:<div id="portlistouterbox"|<div class="hb-box" id="submitbox")',
        page_html, re.DOTALL
    )
    if body_match:
        desc_html = body_match.group(1)
        # Remove the prev/next nav bar
        desc_html = re.sub(r'<div style="border-bottom:2px.*?</div>\s*</div>\s*</div>', '', desc_html, flags=re.DOTALL)
        # Remove style blocks
        desc_html = re.sub(r'<style[^>]*>.*?</style>', '', desc_html, flags=re.DOTALL)
        # Remove image tags but note their alt text
        desc_html = re.sub(r'<img[^>]*alt="([^"]*)"[^>]*>', r'[Image: \1]', desc_html)
        desc_html = re.sub(r'<img[^>]*>', '', desc_html)
        # Remove mw-empty-elt
        desc_html = re.sub(r'<p class="mw-empty-elt">\s*</p>', '', desc_html)
        result["desc"] = decode_html(desc_html)

    # ── Module declaration from portlistbox ──
    port_match = re.search(r'<pre id="portlistbox">(.*?)</pre>', page_html, re.DOTALL)
    if port_match:
        result["module_decl"] = html.unescape(re.sub(r'<[^>]+>', '', port_match.group(1))).strip()

    # ── Hidden starter code (right after portlistbox) ──
    hidden_match = re.search(
        r'<pre id="portlistbox">.*?</pre>\s*<pre[^>]*>(.*?)</pre>',
        page_html, re.DOTALL
    )
    if hidden_match:
        starter = html.unescape(re.sub(r'<[^>]+>', '', hidden_match.group(1))).strip()
        if starter:
            result["starter"] = starter

    # ── Textarea starter code ──
    ta_match = re.search(r'<textarea[^>]*id="codesubmitbox"[^>]*>(.*?)</textarea>', page_html, re.DOTALL)
    if ta_match:
        result["textarea"] = html.unescape(ta_match.group(1)).strip()

    # ── Hint ──
    hint_match = re.search(r'<div class="hb-box" id="hintbox">.*?<div[^>]*>(.*?)</div>', page_html, re.DOTALL)
    if hint_match:
        result["hint"] = decode_html(hint_match.group(1))

    return result


def main():
    catalog = []
    total = len(EXERCISES)

    for i, (slug, tc, cat, title) in enumerate(EXERCISES):
        url = f"{BASE}/wiki/{tc}"
        pct = f"[{i+1}/{total}]"
        print(f"\r{pct} {slug}...", end="", flush=True, file=sys.stderr)

        page = fetch(url)
        if page is None:
            data = {"desc": "", "module_decl": "module top_module();", "starter": "", "hint": ""}
        else:
            data = extract(page)

        catalog.append({
            "index": i,
            "slug": slug,
            "tc": tc,
            "category": cat,
            "title": title,
            "url": url,
            **data,
        })

        # Small delay between requests
        if i < total - 1:
            time.sleep(0.15)

    print("", file=sys.stderr)

    with open("exercises.json", "w") as f:
        json.dump(catalog, f, indent=2)

    print(f"✓ Scraped {total} exercises → exercises.json", file=sys.stderr)


if __name__ == "__main__":
    main()
