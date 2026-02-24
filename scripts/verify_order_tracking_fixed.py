from playwright.sync_api import sync_playwright, expect
import time

def verify_order_tracking():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 393, 'height': 852},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        )
        page = context.new_page()

        # Listen for console logs
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PageError: {err}"))

        # 1. Navigate to domain
        print("Initial Navigation...")
        try:
            page.goto("http://localhost:8080", timeout=30000)
        except Exception as e:
            print(f"Navigation failed: {e}")
            return

        # 2. Seed Data
        print("Seeding Data...")
        active_order = {
            "status": "ORDER_PLACED",
            "address": {
                "id": "addr_123",
                "tag": "Home",
                "plusCode": "9C3XGVWC+W2",
                "line": "10 Downing St, London"
            }
        }

        page.evaluate(f"localStorage.setItem('dotpe_active_order', JSON.stringify({active_order}))")
        page.evaluate("localStorage.setItem('dotpe_user_state', 'loggedIn')")

        # 3. Direct Navigation to Order Tracking
        print("Navigating directly to Order Tracking...")
        page.goto("http://localhost:8080/#/order-tracking")

        try:
            print("Waiting for 'Order Tracking' text...")
            page.wait_for_selector("text=Order Tracking", timeout=15000)

            # Wait for map to load roughly
            time.sleep(2)

            # Check for the loader text
            page.wait_for_selector("text=1 Min")

            print("Taking screenshot at verification/order_tracking_fixed.png...")
            page.screenshot(path="verification/order_tracking_fixed.png")
            print("Done.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/debug_tracking.png")
            print("Captured debug screenshot at verification/debug_tracking.png")

        browser.close()

if __name__ == "__main__":
    verify_order_tracking()
