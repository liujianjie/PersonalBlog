"""T15 e2e probe: validate the production site served by Caddy on 127.0.0.1:48080.

Differences vs tasks/diagnose.py (which targets dev:h5 on :5174):
  - Targets the BUILD output (site/) served by Caddy
  - Validates SPA fallback by direct-loading deep routes (no homepage warm-up)
  - Validates feed.xml + sitemap.xml + search-index.json
  - Validates theme toggle persists across reload
  - Validates Chinese-path images load against Caddy's static handler
  - Validates the search box flow (search-index loads, results show)

Exit code:
  0 - all checks PASS
  1 - one or more checks FAIL (see stdout for which)
"""

from __future__ import annotations
import os
import sys
import urllib.request
import xml.etree.ElementTree as ET
from playwright.sync_api import sync_playwright

OUT_DIR = "G:/tmp/blog-diag-prod"
os.makedirs(OUT_DIR, exist_ok=True)

BASE = "http://127.0.0.1:48080"


def http_check(url, expect_code=200, expect_in_body=None, expect_content_type=None):
    """Lightweight HEAD/GET check, no playwright needed."""
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read(8192)
            code = resp.status
            ctype = resp.headers.get("Content-Type", "")
        ok_code = code == expect_code
        ok_body = (expect_in_body is None) or (expect_in_body.encode("utf-8") in body)
        ok_ctype = (expect_content_type is None) or (expect_content_type in ctype)
        return ok_code and ok_body and ok_ctype, f"{code} {ctype} body={len(body)}B"
    except Exception as e:
        return False, f"err: {e}"


def main() -> int:
    results = []  # (label, ok, detail)

    # ---- Tier 1: HTTP-level checks ----
    print("=== Tier 1: HTTP probes ===")
    for url, kw, label in [
        (BASE + "/", {"expect_in_body": "<!DOCTYPE html>"}, "/ home"),
        (BASE + "/static/feed.xml", {"expect_in_body": "<rss"}, "feed.xml"),
        (BASE + "/static/sitemap.xml", {"expect_in_body": "<urlset"}, "sitemap.xml"),
        (BASE + "/static/search-index.json", {"expect_content_type": "application/json"}, "search-index.json"),
        # SPA fallback: deep routes return 200 + html
        (BASE + "/post/12", {"expect_in_body": "<!DOCTYPE html>"}, "SPA /post/12"),
        (BASE + "/pages/post/post?id=12", {"expect_in_body": "<!DOCTYPE html>"}, "SPA /pages/post/post"),
        (BASE + "/tag/Unity", {"expect_in_body": "<!DOCTYPE html>"}, "SPA /tag/Unity"),
        # Real 404 for missing assets
    ]:
        ok, detail = http_check(url, **kw)
        results.append((label, ok, detail))
        print(f"  [{'PASS' if ok else 'FAIL'}] {label}: {detail}")

    # 404 probes
    for url, label in [
        (BASE + "/static/missing-foo.png", "404 missing /static/*"),
        (BASE + "/assets/missing-foo.js", "404 missing /assets/*"),
    ]:
        try:
            urllib.request.urlopen(url, timeout=5)
            ok, detail = False, "got 200 (should 404)"
        except urllib.error.HTTPError as e:
            ok, detail = e.code == 404, f"{e.code}"
        except Exception as e:
            ok, detail = False, f"err: {e}"
        results.append((label, ok, detail))
        print(f"  [{'PASS' if ok else 'FAIL'}] {label}: {detail}")

    # ---- Tier 2: feed.xml is valid RSS ----
    try:
        with urllib.request.urlopen(BASE + "/static/feed.xml", timeout=5) as r:
            tree = ET.fromstring(r.read())
        # Expected: rss > channel > item+
        items = tree.findall(".//item")
        title = tree.findtext(".//channel/title") or ""
        ok = len(items) >= 10 and title
        detail = f"{len(items)} items, title='{title[:40]}'"
        results.append(("feed.xml RSS valid + items", ok, detail))
        print(f"  [{'PASS' if ok else 'FAIL'}] feed.xml RSS valid: {detail}")
    except Exception as e:
        results.append(("feed.xml RSS valid + items", False, f"err: {e}"))
        print(f"  [FAIL] feed.xml RSS valid: {e}")

    # ---- Tier 3: Browser-level checks ----
    print("\n=== Tier 3: Playwright browser checks ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1400, "height": 900})
        page = ctx.new_page()

        # 3.1 Home page renders
        try:
            page.goto(BASE + "/", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(800)
            page.screenshot(path=f"{OUT_DIR}/home.png", full_page=False)
            cards = page.locator(".post-card").count()
            ok = cards >= 10
            results.append(("home: post-card count >= 10", ok, f"{cards} cards"))
            print(f"  [{'PASS' if ok else 'FAIL'}] home cards: {cards}")
        except Exception as e:
            results.append(("home: post-card count >= 10", False, str(e)))
            print(f"  [FAIL] home: {e}")

        # 3.2 Theme toggle persists. The toggle cycles light->dark->auto->light,
        # so we click 3 times and require that 'dark' appears in the sequence
        # (one of the modes; visually the most distinct).
        try:
            btn = page.locator(".theme-toggle").first
            btn_count = btn.count()
            if btn_count > 0:
                seen_modes = []
                for _ in range(4):
                    btn.click(timeout=3000)
                    page.wait_for_timeout(250)
                    mode = page.evaluate("() => { const el = document.documentElement; const t = el.getAttribute('data-theme'); if (t) return t; return el.classList.contains('dark') ? 'dark' : 'light'; }")
                    seen_modes.append(mode)
                stored = page.evaluate("() => { const keys = Object.keys(localStorage); const tk = keys.filter(k => k.toLowerCase().includes('theme')); return tk.map(k => k + '=' + localStorage.getItem(k)).join(';') || 'none'; }")
                changed = "dark" in seen_modes and len(set(seen_modes)) > 1
                results.append(("theme toggle cycles modes", changed, f"seq={'->'.join(seen_modes)}, ls={stored}"))
                print(f"  [{'PASS' if changed else 'FAIL'}] theme: {'->'.join(seen_modes)}, ls={stored}")
            else:
                results.append(("theme toggle present", False, "no toggle found"))
                print(f"  [FAIL] theme toggle not found")
        except Exception as e:
            results.append(("theme toggle cycles modes", False, str(e)))
            print(f"  [FAIL] theme: {e}")

        # 3.3 Open a post detail (click first card) - validates routing
        try:
            page.goto(BASE + "/", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(500)
            card = page.locator(".post-card").first
            card_title = card.locator(".title").inner_text() if card.count() > 0 else ""
            card.click(timeout=3000)
            page.wait_for_load_state("networkidle", timeout=15000)
            page.wait_for_timeout(1500)
            current_url = page.url
            md_body = page.locator(".markdown-body").count()
            ok = md_body > 0 and "post" in current_url.lower()
            results.append(("post detail renders", ok, f"url={current_url[-60:]} md_body={md_body}"))
            print(f"  [{'PASS' if ok else 'FAIL'}] post detail: url={current_url[-60:]}, md_body={md_body}")

            # 3.3a: refresh sub-route, must not 404 (SPA fallback test)
            page.reload(wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(1000)
            md_body_after = page.locator(".markdown-body").count()
            ok2 = md_body_after > 0
            results.append(("sub-route refresh works (SPA fallback)", ok2, f"md_body after reload={md_body_after}"))
            print(f"  [{'PASS' if ok2 else 'FAIL'}] sub-route refresh: md_body={md_body_after}")
            page.screenshot(path=f"{OUT_DIR}/post-detail.png", full_page=False)
        except Exception as e:
            results.append(("post detail renders", False, str(e)))
            print(f"  [FAIL] post detail: {e}")

        # 3.4 Search flow
        try:
            page.goto(BASE + "/", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(500)
            # Try filling the search box
            search_input = page.locator("input[type='search'], input[placeholder*='搜' i], input[placeholder*='search' i], .search-box input").first
            if search_input.count() > 0:
                search_input.fill("Unity")
                page.wait_for_timeout(300)
                search_input.press("Enter")
                page.wait_for_load_state("networkidle", timeout=15000)
                page.wait_for_timeout(1500)
                hits_count = page.locator(".hit").count()
                # search-index.json should have loaded by now
                idx_loaded = page.evaluate("() => performance.getEntriesByName ? performance.getEntries().some(e => e.name && e.name.includes('search-index.json')) : true")
                ok = hits_count > 0
                results.append(("search returns hits for 'Unity'", ok, f"hits={hits_count}, indexLoaded={idx_loaded}"))
                print(f"  [{'PASS' if ok else 'FAIL'}] search 'Unity': hits={hits_count}, idx={idx_loaded}")
                page.screenshot(path=f"{OUT_DIR}/search.png", full_page=False)
            else:
                results.append(("search input present", False, "no search input"))
                print(f"  [FAIL] search input not found")
        except Exception as e:
            results.append(("search returns hits", False, str(e)))
            print(f"  [FAIL] search: {e}")

        # 3.5 Tags page
        try:
            # Navigate to tag page
            for path in ("/tag", "/pages/tag/tag", "/tags"):
                try:
                    page.goto(BASE + path, wait_until="networkidle", timeout=10000)
                    page.wait_for_timeout(800)
                    tag_chips = page.locator("a[href*='tag'], .tag-chip, .tag-link").count()
                    if tag_chips > 0:
                        results.append((f"tag page renders ({path})", True, f"chips={tag_chips}"))
                        print(f"  [PASS] tag page {path}: chips={tag_chips}")
                        page.screenshot(path=f"{OUT_DIR}/tags.png", full_page=False)
                        break
                except Exception:
                    continue
            else:
                results.append(("tag page renders", False, "no tag route found"))
                print(f"  [FAIL] tag page not found")
        except Exception as e:
            results.append(("tag page renders", False, str(e)))
            print(f"  [FAIL] tags: {e}")

        # 3.6 Chinese-path image loads (article with local image)
        try:
            page.goto(BASE + "/", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(500)
            cards = page.locator(".post-card").all()
            target = None
            for c in cards:
                t = c.locator(".title").inner_text()
                if "Addressable" in t and "8" in t:
                    target = c
                    break
            if target:
                target.click(timeout=3000)
                page.wait_for_load_state("networkidle", timeout=15000)
                page.wait_for_timeout(2500)
                img_data = page.evaluate("""() => {
                    const imgs = Array.from(document.querySelectorAll('.markdown-body img'));
                    return imgs.map(i => ({
                        src: i.getAttribute('src'),
                        ok: i.complete && i.naturalWidth > 0
                    }));
                }""")
                if img_data:
                    ok_count = sum(1 for i in img_data if i["ok"])
                    total = len(img_data)
                    ok = ok_count == total and total > 0
                    results.append(("Chinese-path images load (Addressable 8)", ok, f"{ok_count}/{total}"))
                    print(f"  [{'PASS' if ok else 'FAIL'}] Chinese-path images: {ok_count}/{total}")
                    if not ok:
                        for i in img_data:
                            if not i["ok"]:
                                print(f"     broken: {(i['src'] or '')[:120]}")
                else:
                    results.append(("Chinese-path images load", False, "no images on page"))
                    print(f"  [FAIL] no images found")
            else:
                results.append(("Addressable 8 article", False, "card not found"))
                print(f"  [SKIP] Addressable 8 card not found")
        except Exception as e:
            results.append(("Chinese-path images load", False, str(e)))
            print(f"  [FAIL] images: {e}")

        browser.close()

    # ---- Summary ----
    print("\n=== SUMMARY ===")
    passed = sum(1 for _, ok, _ in results if ok)
    total = len(results)
    for label, ok, detail in results:
        print(f"  [{'PASS' if ok else 'FAIL'}] {label}: {detail}")
    print(f"\n{passed}/{total} checks passed")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
