from playwright.sync_api import sync_playwright
import time
import os

def verify_order_tracking():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Navigating to root to establish storage context...")
        page.goto("http://localhost:8080/")

        # Seed localStorage with London address
        print("Seeding localStorage with London address...")
        page.evaluate("""() => {
            const address = {
                tag: "Home",
                house: "Buckingham Palace",
                area: "London",
                name: "The King",
                phone: "0000000000",
                plusCode: "9C3XGVWC+W2" // London
            };
            localStorage.setItem("dotpe_user_address", JSON.stringify(address));

            const activeOrder = {
                id: "20AB12345",
                amount: 2025.00,
                date: "15 June 2025",
                time: "12:00 PM",
                status: "Ongoing",
                details: "Cash Order",
                address: address
            };
            localStorage.setItem("dotpe_active_order", JSON.stringify(activeOrder));

            localStorage.setItem("dotpe_user_state", "logged_in");
        }""")

        # Navigate to Homepage
        print("Navigating to Homepage...")
        page.goto("http://localhost:8080/#/home")
        page.wait_for_load_state("networkidle")

        # Click on map to go to tracking
        print("Clicking map to navigate to tracking...")
        page.locator(".cursor-pointer").first.click()

        # Wait for navigation
        page.wait_for_url("**/order-tracking")
        print("Navigated to Order Tracking page.")

        # Wait for map to settle (animation)
        time.sleep(3)

        # Take screenshot
        output_dir = "verification"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        output_path = f"{output_dir}/order_tracking_london.png"
        print(f"Taking screenshot at {output_path}...")
        page.screenshot(path=output_path, full_page=True)
        print("Done.")

        browser.close()

if __name__ == "__main__":
    verify_order_tracking()
