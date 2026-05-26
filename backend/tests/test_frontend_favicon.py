from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]


def test_frontend_index_links_to_favicon_asset():
    index_html = (REPO_ROOT / "frontend/index.html").read_text(encoding="utf-8")

    assert 'rel="icon"' in index_html
    assert 'href="/favicon.svg"' in index_html


def test_favicon_asset_exists():
    favicon = REPO_ROOT / "frontend/public/favicon.svg"

    assert favicon.exists()
    assert "<svg" in favicon.read_text(encoding="utf-8")
