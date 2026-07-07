#!/usr/bin/env python3
"""build-assets.py — Optimización de carga del frontend (MPA).

Hace dos cosas:
  1) Genera assets/dist/core.css concatenando los CSS universales
     (variables + themes + base) -> 1 request en vez de 3.
  2) Optimiza el <head> de cada pages/*/index.html:
       - preconnect + <link> de la fuente Inter (fuera del @import anidado)
       - reemplaza los 3 CSS universales por /assets/dist/core.css
       - añade defer a todos los <script src> salvo theme-early.js
       - inserta Speculation Rules para prefetch al hover (navegación instantánea)

Es idempotente: se puede ejecutar varias veces sin duplicar cambios.

Uso:
  python3 build-assets.py            # genera bundle + transforma todas las páginas
  python3 build-assets.py --dry FILE # muestra el resultado de una página sin escribir
"""
import re, sys, glob, os

ROOT = os.path.dirname(os.path.abspath(__file__))
CORE_SOURCES = ['assets/css/variables.css', 'assets/themes/themes.css', 'assets/css/base.css']
CORE_OUT = 'assets/dist/core.css'
CORE_HREF = '/assets/dist/core.css'
UNIVERSAL_CSS = ['/assets/css/variables.css', '/assets/themes/themes.css', '/assets/css/base.css']

FONT_BLOCK = (
    '    <link rel="preconnect" href="https://fonts.googleapis.com" />\n'
    '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n'
    '    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
    'family=Inter:wght@400;500;600;700;800;900&display=swap" />\n'
)

SPECRULES = '''    <script type="speculationrules">
    {
      "prefetch": [{
        "source": "document",
        "where": { "and": [
          { "href_matches": "/*" },
          { "not": { "href_matches": "/api/*" } },
          { "not": { "selector_matches": "[target=_blank]" } },
          { "not": { "selector_matches": "[rel~=nofollow]" } }
        ]},
        "eagerness": "moderate"
      }]
    }
    </script>
'''

MARK_FONT = 'fonts.gstatic.com'
MARK_SPEC = 'speculationrules'


def build_core():
    os.makedirs(os.path.join(ROOT, os.path.dirname(CORE_OUT)), exist_ok=True)
    parts = ['/* ARCHIVO GENERADO por build-assets.py — NO EDITAR A MANO.\n'
             '   Fuentes: ' + ', '.join(CORE_SOURCES) + ' */\n']
    for src in CORE_SOURCES:
        with open(os.path.join(ROOT, src), encoding='utf-8') as fh:
            parts.append(f'\n/* ===== {src} ===== */\n' + fh.read())
    with open(os.path.join(ROOT, CORE_OUT), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(parts))
    return CORE_OUT


def transform_html(text):
    lines = text.split('\n')
    out = []
    core_inserted = 'core.css' in text
    font_inserted = MARK_FONT in text
    for line in lines:
        # 1) CSS universales -> core.css (el primero se sustituye, los otros se omiten)
        if any(('href="%s"' % u) in line for u in UNIVERSAL_CSS):
            if not core_inserted:
                indent = re.match(r'\s*', line).group(0)
                if not font_inserted:
                    out.append(FONT_BLOCK.rstrip('\n'))
                    font_inserted = True
                out.append('%s<link rel="stylesheet" href="%s" />' % (indent, CORE_HREF))
                core_inserted = True
            # omitir esta línea (ya sea reemplazada o duplicada)
            continue
        # 2) defer en scripts con src, salvo theme-early.js y los que ya lo tienen
        m = re.match(r'(\s*)<script\s+src="([^"]+)"\s*>\s*</script>\s*$', line)
        if m and 'theme-early.js' not in m.group(2):
            out.append('%s<script src="%s" defer></script>' % (m.group(1), m.group(2)))
            continue
        out.append(line)
    text = '\n'.join(out)
    # 3) Speculation Rules antes de </body> (una vez)
    if MARK_SPEC not in text and '</body>' in text:
        text = text.replace('</body>', SPECRULES + '</body>', 1)
    return text


def main():
    os.chdir(ROOT)
    if len(sys.argv) >= 3 and sys.argv[1] == '--dry':
        print(transform_html(open(sys.argv[2], encoding='utf-8').read()))
        return
    core = build_core()
    n = os.path.getsize(core)
    print(f"[bundle] {core} generado ({n} bytes)")
    # Todas las páginas a cualquier profundidad (admin/centinel, admin/metadata, …).
    pages = sorted(glob.glob('pages/**/index.html', recursive=True))
    changed = 0
    skipped = []
    for f in pages:
        src = open(f, encoding='utf-8').read()
        # Saltar redirects / páginas sin CSS propios (p.ej. pages/index.html).
        if not any(u in src for u in UNIVERSAL_CSS) and CORE_HREF not in src:
            skipped.append(f)
            continue
        new = transform_html(src)
        if new != src:
            open(f, 'w', encoding='utf-8').write(new)
            changed += 1
    print(f"[html] {changed} páginas transformadas, {len(skipped)} saltadas: {skipped}")


if __name__ == '__main__':
    main()
