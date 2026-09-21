Caveat by Impallari Type, SIL Open Font License 1.1.

`Caveat.ttf` is the upstream file. `caveat.woff2` is the subset that ships inside the
generated SVGs, and `src/font.ts` is that subset base64-encoded so ncc can bundle it.

Regenerate the subset with `npm run font`, then re-encode:

    python -c "import base64;print(base64.b64encode(open('assets/caveat.woff2','rb').read()).decode())"
