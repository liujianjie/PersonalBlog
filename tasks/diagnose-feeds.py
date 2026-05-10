"""Verify gen-feeds.ps1 output: feed.xml and sitemap.xml.

Asserts:
  - both files exist and parse as XML
  - feed.xml is RSS 2.0 with the expected channel + items
  - every post in posts.ts has an <item> in the feed and a <url> in sitemap
  - links use the absolute https://blog.multilab.cc base
  - dates parse as RFC 822 (feed) and ISO YYYY-MM-DD (sitemap)
  - Chinese titles round-trip (no mojibake)

Run AFTER scripts/gen-feeds.ps1 has executed.
"""
from __future__ import annotations
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POSTS_TS = ROOT / "frontend-uniapp" / "data" / "posts.ts"
FEED = ROOT / "frontend-uniapp" / "static" / "feed.xml"
SITEMAP = ROOT / "frontend-uniapp" / "static" / "sitemap.xml"

SITE = "https://blog.multilab.cc"

POST_RE = re.compile(
    r"\{\s*"
    r"id:\s*'([^']+)',\s*"
    r"title:\s*'([^']+)',",
    re.MULTILINE,
)


def parse_posts():
    src = POSTS_TS.read_text(encoding="utf-8")
    return [(m.group(1), m.group(2)) for m in POST_RE.finditer(src)]


def main() -> int:
    failures: list[str] = []
    posts = parse_posts()
    print(f"posts.ts has {len(posts)} posts")
    if len(posts) == 0:
        failures.append("no posts parsed from posts.ts")

    # ---- feed.xml ----
    if not FEED.exists():
        failures.append(f"feed.xml missing at {FEED}")
    else:
        try:
            feed_tree = ET.parse(FEED)
            feed_root = feed_tree.getroot()
            print(f"feed.xml root tag = {feed_root.tag}, version = {feed_root.get('version')}")
            if feed_root.tag != "rss" or feed_root.get("version") != "2.0":
                failures.append(f"feed.xml not RSS 2.0: tag={feed_root.tag}")
            channel = feed_root.find("channel")
            if channel is None:
                failures.append("feed.xml missing <channel>")
            else:
                items = channel.findall("item")
                print(f"feed.xml has {len(items)} <item>s")
                if len(items) != len(posts):
                    failures.append(f"feed item count {len(items)} != posts {len(posts)}")

                feed_ids = set()
                for it in items:
                    link = (it.findtext("link") or "").strip()
                    title = (it.findtext("title") or "").strip()
                    pub = (it.findtext("pubDate") or "").strip()
                    if not link.startswith(SITE):
                        failures.append(f"item link not absolute: {link}")
                    m = re.search(r"id=([^&]+)", link)
                    if m:
                        feed_ids.add(m.group(1))
                    if not title:
                        failures.append("item with empty title")
                    try:
                        datetime.strptime(pub, "%a, %d %b %Y %H:%M:%S GMT")
                    except ValueError:
                        failures.append(f"pubDate not RFC 822: {pub!r}")

                missing = [pid for pid, _ in posts if pid not in feed_ids]
                if missing:
                    failures.append(
                        f"feed missing {len(missing)} post ids, e.g. {missing[:5]}"
                    )

                # spot-check a Chinese title round-trips
                titles = [(it.findtext("title") or "") for it in items]
                if not any("Addressable" in t for t in titles):
                    failures.append("feed: no title containing 'Addressable'")
                if not any(any(0x4e00 <= ord(c) <= 0x9fff for c in t) for t in titles):
                    failures.append("feed: no Chinese characters in any title")
        except ET.ParseError as e:
            failures.append(f"feed.xml not valid XML: {e}")

    # ---- sitemap.xml ----
    if not SITEMAP.exists():
        failures.append(f"sitemap.xml missing at {SITEMAP}")
    else:
        try:
            sm_tree = ET.parse(SITEMAP)
            sm_root = sm_tree.getroot()
            ns = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
            if sm_root.tag != f"{ns}urlset":
                failures.append(f"sitemap.xml root not urlset: {sm_root.tag}")
            urls = sm_root.findall(f"{ns}url")
            print(f"sitemap.xml has {len(urls)} <url>s")
            if len(urls) < len(posts):
                failures.append(f"sitemap url count {len(urls)} < posts {len(posts)}")

            sm_ids = set()
            for u in urls:
                loc = (u.findtext(f"{ns}loc") or "").strip()
                lastmod = u.findtext(f"{ns}lastmod")
                if not loc.startswith(SITE):
                    failures.append(f"sitemap loc not absolute: {loc}")
                m = re.search(r"id=([^&]+)", loc)
                if m:
                    sm_ids.add(m.group(1))
                if lastmod:
                    try:
                        datetime.strptime(lastmod.strip(), "%Y-%m-%d")
                    except ValueError:
                        failures.append(f"sitemap lastmod not YYYY-MM-DD: {lastmod!r}")

            missing_sm = [pid for pid, _ in posts if pid not in sm_ids]
            if missing_sm:
                failures.append(
                    f"sitemap missing {len(missing_sm)} post ids, e.g. {missing_sm[:5]}"
                )
        except ET.ParseError as e:
            failures.append(f"sitemap.xml not valid XML: {e}")

    print("\n=== SUMMARY ===")
    if failures:
        for f in failures:
            print(f"  [FAIL] {f}")
        return 1
    print("  [PASS] gen-feeds output valid")
    return 0


if __name__ == "__main__":
    sys.exit(main())
