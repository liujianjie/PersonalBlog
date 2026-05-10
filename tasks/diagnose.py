"""Diagnose blog rendering. Probes two articles to cover all three reported regressions:
  - Addressable 8         : local Chinese-path images + GitHub raw images, no code blocks
  - LearnOpenGL-1.5 (着色器): GitHub raw images + many GLSL/cpp fenced code blocks

Run after starting dev:h5 on 5174.
"""
from __future__ import annotations
import json
import os
import sys
from playwright.sync_api import sync_playwright

OUT_DIR = "G:/tmp/blog-diag"
os.makedirs(OUT_DIR, exist_ok=True)

BASE = "http://127.0.0.1:5174"

TARGETS = [
    {"slug": "addr8", "match": ["Addressable", "8"], "expect_code_blocks": False},
    {"slug": "ogl15", "match": ["LearnOpenGL", "1.5", "着色"], "expect_code_blocks": True},
]


def find_card(page, match_terms):
    cards = page.locator(".post-card").all()
    for c in cards:
        title = c.locator(".title").inner_text()
        if all(t in title for t in match_terms):
            return c, title
    return None, None


def probe(page, label):
    img_data = page.evaluate(
        """() => {
          const imgs = Array.from(document.querySelectorAll('.markdown-body img'));
          return imgs.map(i => ({
            src: i.getAttribute('src'),
            naturalWidth: i.naturalWidth,
            complete: i.complete,
          }));
        }"""
    )
    sel = page.evaluate(
        """() => {
          const p = document.querySelector('.markdown-body p, .markdown-body h1');
          if (!p) return { ok: false };
          const r = document.createRange(); r.selectNodeContents(p);
          const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
          const cs = window.getComputedStyle(p);
          return {
            ok: true,
            len: s.toString().length,
            head: s.toString().slice(0, 60),
            userSelect: cs.userSelect,
            tag: p.tagName,
          };
        }"""
    )
    code = page.evaluate(
        """() => {
          const codes = Array.from(document.querySelectorAll('.markdown-body pre code'));
          return codes.slice(0, 3).map(c => {
            const cs = window.getComputedStyle(c);
            return {
              cls: c.className,
              hasToken: !!c.querySelector('.hljs-keyword, .hljs-string, .hljs-comment, .hljs-title, .hljs-type, .hljs-built_in, .hljs-attr'),
              fg: cs.color, bg: cs.backgroundColor,
              text: c.textContent.slice(0, 60),
            };
          });
        }"""
    )

    print(f"\n=== {label} ===")
    print(f"images: {len(img_data)}")
    broken_abs = []
    broken_rel = []
    ok = []
    for im in img_data:
        src = im["src"] or ""
        if im["naturalWidth"] == 0 and im["complete"]:
            if src.startswith("https") or src.startswith("http") or "%3A" in src[:10]:
                broken_abs.append(src)
            else:
                broken_rel.append(src)
        else:
            ok.append(src)
    print(f"  ok={len(ok)} brokenAbs={len(broken_abs)} brokenRel={len(broken_rel)}")
    for s in broken_abs[:3]:
        print(f"  brokenAbs: {s[:140]}")
    for s in broken_rel[:3]:
        print(f"  brokenRel: {s[:140]}")
    print(f"selection: len={sel['len']} userSelect={sel['userSelect']} head={sel['head']!r}")
    print(f"code blocks: {len(code)}")
    for i, cb in enumerate(code):
        print(
            f"  [{i}] cls={cb['cls']!r} hasToken={cb['hasToken']} fg={cb['fg']} bg={cb['bg']}"
        )
        print(f"       text: {cb['text']!r}")

    return {
        "label": label,
        "imgs_ok": len(ok),
        "imgs_brokenAbs": len(broken_abs),
        "imgs_brokenRel": len(broken_rel),
        "sel_len": sel["len"],
        "sel_userSelect": sel["userSelect"],
        "code_count": len(code),
        "code_hasTokens": [c["hasToken"] for c in code],
    }


def main() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()
        results = []

        for t in TARGETS:
            print(f"\n[goto home] for target={t['slug']}")
            page.goto(BASE + "/", wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(800)
            card, title = find_card(page, t["match"])
            if not card:
                print(f"  [skip] no card matching {t['match']}")
                continue
            print(f"  click: {title}")
            card.click()
            page.wait_for_load_state("networkidle", timeout=30000)
            page.wait_for_timeout(1500)
            page.screenshot(path=f"{OUT_DIR}/{t['slug']}.png", full_page=True)
            r = probe(page, f"{t['slug']} = {title}")
            r["expect_code"] = t["expect_code_blocks"]
            results.append(r)

        print("\n\n=== SUMMARY ===")
        all_ok = True
        for r in results:
            img_ok = r["imgs_brokenAbs"] == 0 and r["imgs_brokenRel"] == 0
            sel_ok = r["sel_len"] > 0 and r["sel_userSelect"] in ("text", "auto")
            if r["expect_code"]:
                code_ok = r["code_count"] > 0 and any(r["code_hasTokens"])
            else:
                code_ok = True  # n/a
            verdict = "PASS" if (img_ok and sel_ok and code_ok) else "FAIL"
            if verdict == "FAIL":
                all_ok = False
            print(
                f"  [{verdict}] {r['label']}: img_ok={img_ok} sel_ok={sel_ok} code_ok={code_ok} "
                f"(imgs={r['imgs_ok']}/{r['imgs_ok']+r['imgs_brokenAbs']+r['imgs_brokenRel']}, "
                f"selLen={r['sel_len']}, codeBlocks={r['code_count']})"
            )

        browser.close()
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
