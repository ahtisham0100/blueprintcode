#!/usr/bin/env python3
"""Browser smoke test for dist/blueprint-builder.html.

    pip install playwright && playwright install chromium
    python3 build.py && python3 tests/e2e/smoke.py

Covers: suggestions, adding and renaming tools, discovery answers, Rules Studio sync, the cinema demo,
the journey editor, what-if, document approval, change diff, comments, exports, save and reload.
Fails on any page error or failed check.
"""
import asyncio
import json
import sys
from pathlib import Path
from playwright.async_api import async_playwright

PAGE = (Path(__file__).resolve().parents[2] / "dist" / "blueprint-builder.html").as_uri()
FAILS = []


def check(ok, label):
    print(("PASS " if ok else "FAIL ") + label)
    if not ok:
        FAILS.append(label)


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1440, "height": 1000}, accept_downloads=True)
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))

        async def on_dialog(d):
            await (d.accept("Which ERP?") if d.type == "prompt" else d.accept())
        pg.on("dialog", lambda d: asyncio.ensure_future(on_dialog(d)))

        await pg.goto(PAGE)
        await pg.click("[data-pact=new]")
        await pg.fill("#app-name", "Smoke test")
        await pg.fill("#app-desc", "Sell projector screens with multiple variables (15 materials, 1500 sizes) through dealers and reps in the field. We also need a backend to keep track of KPI.")
        await pg.click("[data-pact=suggest]")
        names = await pg.locator(".scard h3").all_inner_texts()
        check(all(n in names for n in ["Configure & Visualise", "Select & Recommend", "Quote & Convert", "Connect & Automate"]), "suggestions cover every area mentioned")
        check(await pg.locator(".signals").count() == 1, "usage signals shown")

        await pg.click(".scard:has(h3:text('Select & Recommend')) [data-pact=add-sugg]")
        await pg.click("[data-pact=rename][data-id='T-01']")
        await pg.fill("#rn-T-01", "Screen Finder")
        await pg.click("[data-pact=rename-save][data-id='T-01']")
        check("Screen Finder" in await pg.locator(".tcard h3").all_inner_texts(), "tool added and renamed")

        await pg.click("#card-T-01 a.btn")
        await pg.click("[data-dact=example]")
        await pg.click(".apptabs a:text('Rules Studio')")
        check(await pg.locator(".rule").count() >= 4, "discovery answers suggest rules in the Rules Studio")

        await pg.goto(PAGE + "#/project")
        await pg.click("[data-pact=demo]")
        await pg.click("a:text('Open the journey editor')")
        await pg.wait_for_selector(".lcard")
        check(await pg.locator(".lcard").count() == 5, "cinema demo has five connections")
        await pg.click("#cxt-whatif")
        await pg.select_option("#cx-wi", "f:F-01")
        steps = await pg.locator(".steps-list li").all_inner_texts()
        check(len(steps) >= 3 and "Projector Selector" in steps[0], "changing room width shows downstream effects in order")

        await pg.goto(PAGE + "#/blueprint")
        check(await pg.locator(".dcard").count() == 40, "forty documents for three tools")
        async with pg.expect_download() as d:
            await pg.click("[data-dcact=handover]")
        h = json.loads(Path(await (await d.value).path()).read_text())
        check(h["schema"] == "bpc.handover/1" and len(h["tools"]) == 3, "developer handover exports")

        # Confirm T-01's discovery, approve a document, change an answer, see the diff.
        await pg.goto(PAGE + "#/tool/T-01")
        for sec in ["A", "B", "Z"]:
            await pg.click(f"#disc-root [data-dgo='{sec}']")
            for q in await pg.locator("#disc-root .q").all():
                if "needed" not in await q.inner_text():
                    continue
                ta = q.locator("textarea")
                if await ta.count() and not await ta.input_value():
                    await ta.fill("Smoke answer")
                    await ta.press("Tab")
                radios = q.locator("input[type=radio]")
                if await radios.count() and not await q.locator("input:checked").count():
                    await radios.first.check()
            btn = pg.locator("#disc-root [data-dact=confirm]")
            if await btn.count() and await btn.is_enabled():
                await btn.click()
        await pg.goto(PAGE + "#/doc/T-01-PURPOSE")
        check(await pg.inner_text(".docact .st-chip") == "Ready for client review", "document ready once sections confirmed")
        await pg.click("[data-dcact=approve]")
        check(await pg.inner_text(".docact .st-chip") == "Client approved", "client approval")
        await pg.click("[data-dcact=thread][data-item='REQ-T-01-PC-A01']")
        await pg.fill("#cm-text", "Include installers")
        await pg.click("[data-dcact=comment]")
        check("1 comment" in await pg.inner_text("[data-dcact=thread][data-item='REQ-T-01-PC-A01']"), "comment on an item")
        await pg.goto(PAGE + "#/tool/T-01")
        await pg.click("#disc-root [data-dgo='A']")
        await pg.fill("#PC-A02-in", "Only the seating layout")
        await pg.press("#PC-A02-in", "Tab")
        await pg.goto(PAGE + "#/doc/T-01-PURPOSE")
        check(await pg.inner_text(".docact .st-chip") == "Needs review", "change after approval needs review")
        check("Only the seating layout" in await pg.inner_text(".diff"), "diff shows the new wording")

        await pg.reload()
        await pg.goto(PAGE + "#/project")
        check(await pg.input_value("#app-name") == "Cinema room package" and await pg.locator(".tcard").count() == 3, "project survives reload")
        check(not errors, "no page errors" + (": " + "; ".join(errors) if errors else ""))
        await b.close()


asyncio.run(main())
sys.exit(1 if FAILS else 0)
