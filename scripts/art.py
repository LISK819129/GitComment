from PIL import Image
import base64, io, os

targets = {
    'catsleep.png': (240, 16), 'blossomtree.png': (420, 22), 'blossom.png': (180, 10),
    'blackcat.png': (200, 14), 'comiccitybg.png': (900, 18), 'greencat.png': (170, 12),
}

for name, (width, budget) in targets.items():
    im = Image.open(f'assets/{name}').convert('RGBA')
    im = im.resize((width, max(1, round(im.height * width / im.width))), Image.LANCZOS)
    for colors in (128, 96, 64, 48, 32, 24, 16):
        im.quantize(colors=colors, method=Image.Quantize.FASTOCTREE).save(f'assets/art/{name}', optimize=True)
        if os.path.getsize(f'assets/art/{name}') / 1024 <= budget:
            break

names = {
    'catsleep': 'catsleep.png', 'blossomTree': 'blossomtree.png', 'blossom': 'blossom.png',
    'blackCat': 'blackcat.png', 'comicCity': 'comiccitybg.png', 'pixelCat': 'greencat.png',
}

out = ['// Artwork by Atul Krishna (LISK819129). Regenerate with npm run art.', '']
for key, name in names.items():
    data = base64.b64encode(open(f'assets/art/{name}', 'rb').read()).decode()
    out += [f"export const {key} =", f"  'data:image/png;base64,{data}'", '']

io.open('src/art.ts', 'w', encoding='utf-8', newline='\n').write('\n'.join(out))
print('regenerated src/art.ts')
