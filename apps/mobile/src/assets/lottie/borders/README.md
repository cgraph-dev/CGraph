# Lottie Border Assets

This folder contains Lottie JSON files for avatar border animations.

## Rules

- Filenames **must** match the `lottieFile` field in `BORDER_REGISTRY` exactly
- Use the prompts in `docs/design/LOTTIE_GENERATION_PROMPTS.md` to generate each file
- FREE and COMMON borders are static — use single-frame Lottie JSON or PNG
- RARE through MYTHIC borders are animated — use full Lottie JSON
- Canvas size: 200×200px, transparent background
- `placeholder.json` is the fallback used when a border's asset is not yet generated
