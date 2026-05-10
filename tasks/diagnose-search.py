"""Probe T10 search flow:
  1. Home loads, header has search-box input
  2. Type 'Addressable' + submit -> navigates to /pages/search/search?q=...
  3. Search index loads, results render, top hit title contains 'Addressable'
  4. Click a result -> navigates to /pages/post/post?id=...

Run after starting dev:h5 on 5174.
"""
from __future__ import annotations
import os
import sys
from playwright.sync_api import sync_playwright

OUT_DIR = "G:/tmp/blog-diag"
os.makedirs(OUT_DIR, exist_ok=True)
BASE = "http://127.0.0.1:5174"


def main() -> int:
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        print("[1] goto home")
        page.goto(BASE + "/", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(800)

        # Header search input present? uni-app wraps input as
        # <uni-input class="search-input"><input class="uni-input-input">
        sb = page.locator(".search-box input.uni-input-input").first
        if sb.count() == 0:
            failures.append("search-box input not found in header")
        else:
            print("  ok: header search input present")

        # Type and submit
        print("[2] type 'Addressable' + Enter")
        sb.fill("Addressable")
        sb.press("Enter")
        page.wait_for_url("**/pages/search/search**", timeout=10000)
        print(f"  url: {page.url}")
        if "q=Addressable" not in page.url:
            failures.append(f"search url missing q=Addressable: {page.url}")

        # Wait for search index to load + results to render
        page.wait_for_timeout(1500)
        page.screenshot(path=f"{OUT_DIR}/search-results.png", full_page=True)

        # Check no error state
        error_state = page.locator(".state.error").count()
        if error_state > 0:
            err_text = page.locator(".state.error").first.inner_text()
            failures.append(f"error state visible: {err_text}")

        # Result count + top hit
        info = page.evaluate(
            """() => {
              const hits = Array.from(document.querySelectorAll('.hit'));
              const label = (document.querySelector('.result-label') || {}).textContent || '';
              return {
                count: hits.length,
                label,
                topTitle: hits[0] ? hits[0].querySelector('.hit-title').textContent : null,
                hasMark: hits[0] ? !!hits[0].querySelector('mark') : false,
                topTags: hits[0] ? Array.from(hits[0].querySelectorAll('.tag')).map(t => t.textContent) : []
              };
            }"""
        )
        print(f"  hits: {info['count']}, label: {info['label']!r}")
        print(f"  top title: {info['topTitle']!r}")
        print(f"  top tags: {info['topTags']}")
        print(f"  has <mark>: {info['hasMark']}")
        if info["count"] == 0:
            failures.append("no search results rendered")
        elif "Addressable" not in (info["topTitle"] or ""):
            failures.append(f"top hit title missing 'Addressable': {info['topTitle']!r}")
        if info["count"] > 0 and not info["hasMark"]:
            failures.append("highlighting <mark> tag not applied to top hit")

        # Click first result -> navigates to post page
        if info["count"] > 0:
            print("[3] click top result")
            page.locator(".hit").first.click()
            page.wait_for_url("**/pages/post/post**", timeout=10000)
            print(f"  url: {page.url}")
            page.wait_for_timeout(1000)
            page.screenshot(path=f"{OUT_DIR}/search-clicked.png", full_page=True)

        # Empty query state
        print("[4] navigate to search with empty query")
        page.goto(BASE + "/pages/search/search", wait_until="networkidle", timeout=10000)
        page.wait_for_timeout(800)
        empty_state = page.locator(".state").count()
        print(f"  empty-state count: {empty_state}")
        if empty_state == 0:
            failures.append("empty search did not render hint state")

        browser.close()

    print("\n=== SUMMARY ===")
    if failures:
        for f in failures:
            print(f"  [FAIL] {f}")
        return 1
    print("  [PASS] T10 search flow")
    return 0


if __name__ == "__main__":
    sys.exit(main())
