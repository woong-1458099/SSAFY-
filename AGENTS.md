# AGENTS Rules

## Core Behavior
- When the user asks for a code change, make the requested code changes directly in this repository.
- Do not stop at explanation-only responses when the user is clearly asking for implementation.

## Long-Term Memory
- Record every repository modification in a Markdown file under `AI_LONG/`.
- Each memory note should briefly state what changed, which files were touched, and any important follow-up context.
- `AI_LONG/` is local long-term memory and should remain out of version control.
