#!/usr/bin/env python3
"""Manual smoke test only. Does not run GitHub Actions or create artifacts.
Usage: CK_BASE_URL=https://conceptknot.vercel.app python tests/workspace-v6-smoke.py
Requires optional playwright + Chromium installed locally.
"""
import asyncio, os
from playwright.async_api import async_playwright
URL=os.environ.get("CK_BASE_URL","https://conceptknot.vercel.app")
async def main():
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(headless=True)
        page=await browser.new_page(viewport={"width":1365,"height":850},reduced_motion="reduce")
        await page.goto(URL,wait_until="domcontentloaded")
        await page.wait_for_selector(".ck-v7-stage",timeout=20000)
        header=page.locator(".ck-v7-nav-pill.ck4-unified")
        board=page.locator(".ck-v7-board-shell")
        content=page.locator(".ck-v7-content")
        button=page.locator(".ck6-swap-btn")
        assert await button.count()==1
        hb=await header.bounding_box(); sb=await page.locator(".ck-v7-stage").bounding_box()
        assert abs(hb["x"]-sb["x"])<=2,(hb,sb)
        assert abs((hb["x"]+hb["width"])-(sb["x"]+sb["width"]))<=2,(hb,sb)
        a=await board.bounding_box();b=await content.bounding_box()
        assert a["x"]<b["x"]
        await button.click()
        a=await board.bounding_box();b=await content.bounding_box()
        assert a["x"]>b["x"]
        assert await button.get_attribute("aria-pressed")=="true"
        await page.locator('.ck-v7-nav-pill [data-go="typing"]').click()
        assert await page.locator(".ck-v7-stage").evaluate("(el)=>el.classList.contains('ck6-swapped')")
        await page.reload(wait_until="domcontentloaded")
        await page.wait_for_selector(".ck6-swap-btn")
        assert await page.locator(".ck6-swap-btn").get_attribute("aria-pressed")=="true"
        await browser.close()
        print("PASS: equal gutters, swap, ARIA, tab persistence and reload")
asyncio.run(main())
