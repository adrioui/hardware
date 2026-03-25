#!/usr/bin/env bash
# Run verible-verilog-format only on solved exercises (no "I AM NOT DONE" marker).
# Pre-commit passes file paths as positional args after any flags.

args=()
files=()

for arg in "$@"; do
  if [[ -f "$arg" ]]; then
    if ! grep -q "I AM NOT DONE" "$arg"; then
      files+=("$arg")
    fi
  else
    args+=("$arg")
  fi
done

[[ ${#files[@]} -eq 0 ]] && exit 0
exec verible-verilog-format "${args[@]}" "${files[@]}"
