"""
Build the two one-glyph fonts that draw the dong sign (U+20AB) in Geist style.

Why this exists: neither Geist face ships U+20AB, and VND is the app's only
currency, so every amount on every screen hit a per-glyph font fallback. The
browser took the sign from Arial (next/font's metric-adjusted "Geist Fallback")
or Consolas, and those draw it as a small raised mark in a foreign weight, so
"11.847.920 ₫" read like a typo next to Geist digits.

Geist does ship U+0111 (d with stroke, glyph "dcroat"), and the dong sign is
that letter with a bar beneath it. So the glyph is composed from Geist's own
parts rather than drawn: a composite of dcroat plus Geist's underscore, lowered
below the baseline. Both components are variable, so the sign follows the wght
axis exactly like the digits beside it; nothing is re-outlined by hand.

The output is a subset carrying only U+20AB. layout.tsx loads it with
unicode-range U+20AB and lists it first in the font stacks, so the browser uses
it for the dong sign and falls through to Geist for everything else.

Rerun after upgrading the `geist` package (needs Python 3 + fonttools):

    pip install fonttools
    python scripts/build-dong-font.py
"""

from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import Glyph, GlyphComponent
from fontTools.ttLib.tables.TupleVariation import TupleVariation

ROOT = Path(__file__).resolve().parent.parent
GEIST = ROOT / "node_modules" / "geist" / "dist" / "fonts"
OUT = ROOT / "src" / "fonts"

DONG = 0x20AB
GLYPH = "uni20AB"
# Top of the bar, in font units below the baseline. Clears the bowl's overshoot
# (-12) by roughly one hairline, so the bar reads as part of the sign rather
# than as an underline sitting on the text.
BAR_TOP = -95

FACES = [
    (GEIST / "geist-sans" / "Geist-Variable.ttf", "XuPay Dong Sans", "dong-sans.woff"),
    (GEIST / "geist-mono" / "GeistMono-Variable.ttf", "XuPay Dong Mono", "dong-mono.woff"),
]


def bounds(font: TTFont, name: str):
    pen = BoundsPen(font.getGlyphSet())
    font.getGlyphSet()[name].draw(pen)
    return pen.bounds  # (xMin, yMin, xMax, yMax)


def build(src: Path, family: str, out_name: str) -> None:
    font = TTFont(src)
    glyf = font["glyf"]

    # The bar spans the letter's body: from the bowl's left edge to the stem's
    # right edge. Measured on plain "d", because dcroat's crossbar overhangs
    # the stem and would make the bar too long.
    d_min, _, d_max, _ = bounds(font, "d")
    u_min, _, u_max, u_top = bounds(font, "underscore")
    scale = (d_max - d_min) / (u_max - u_min)

    letter = GlyphComponent()
    letter.glyphName = "dcroat"
    letter.x, letter.y = 0, 0
    letter.flags = 0

    bar = GlyphComponent()
    bar.glyphName = "underscore"
    # Scale about the origin, then shift so the scaled bar starts at d's xMin.
    bar.x = round(d_min - u_min * scale)
    bar.y = BAR_TOP - u_top
    bar.flags = 0
    if abs(scale - 1) > 0.005:
        bar.transform = [[scale, 0], [0, 1]]

    glyph = Glyph()
    glyph.numberOfContours = -1
    glyph.components = [letter, bar]

    order = font.getGlyphOrder() + [GLYPH]
    font.setGlyphOrder(order)
    glyf.glyphOrder = order
    glyf[GLYPH] = glyph
    font["hmtx"][GLYPH] = font["hmtx"]["dcroat"]
    glyph.recalcBounds(glyf)

    # A composite's variation "points" are its component offsets plus four
    # phantom points (advance/side bearings). Offsets stay put, since each
    # component varies itself; the phantom deltas are copied from dcroat so
    # the sign's advance tracks the letter's across the weight axis.
    gvar = font["gvar"]
    variations = []
    for tv in gvar.variations.get("dcroat", []):
        phantom = tv.coordinates[-4:]
        variations.append(TupleVariation(dict(tv.axes), [(0, 0), (0, 0)] + list(phantom)))
    gvar.variations[GLYPH] = variations

    # HVAR indexes advances by glyph; the new glyph has no row in it. Without
    # HVAR, renderers derive advance variation from the gvar phantom points
    # set above, which is exactly what they carry.
    del font["HVAR"]

    for table in font["cmap"].tables:
        if table.isUnicode():
            table.cmap[DONG] = GLYPH

    options = Options()
    options.layout_features = []
    options.notdef_outline = False
    options.name_IDs = ["*"]
    options.drop_tables += ["meta"]
    options.flavor = "woff"
    subsetter = Subsetter(options)
    subsetter.populate(unicodes=[DONG])
    subsetter.subset(font)

    name = font["name"]
    for rec in name.names:
        if rec.nameID in (1, 16):
            rec.string = family
        elif rec.nameID in (4,):
            rec.string = f"{family} Regular"
        elif rec.nameID == 6:
            rec.string = family.replace(" ", "") + "-Regular"

    OUT.mkdir(parents=True, exist_ok=True)
    font.flavor = "woff"
    font.save(OUT / out_name)
    print(f"{out_name}: {(OUT / out_name).stat().st_size} bytes, bar scale {scale:.3f}")


if __name__ == "__main__":
    for src, family, out_name in FACES:
        build(src, family, out_name)
