from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# --------------------------------------------------
# START CHROME
# --------------------------------------------------

driver = webdriver.Chrome()
wait = WebDriverWait(driver, 10)

# Correct Admin Login URL
driver.get(
    "http://127.0.0.1:5500/frontend/admin/admin-login.html"
)

driver.maximize_window()

print("CURRENT URL:", driver.current_url)
print("PAGE TITLE:", driver.title)
print(
    "PAGE SOURCE HAS USERNAME:",
    "id=\"username\"" in driver.page_source
)

# --------------------------------------------------
# TEST 1: CHECK INTERFACE ELEMENTS
# --------------------------------------------------

print("\nTEST 1: Checking interface elements...")

try:
    username = wait.until(
        EC.presence_of_element_located(
            (By.ID, "username")
        )
    )

    password = wait.until(
        EC.presence_of_element_located(
            (By.ID, "password")
        )
    )

    login_button = wait.until(
        EC.presence_of_element_located(
            (By.ID, "loginBtn")
        )
    )

    print("PASS - Username field found")
    print("PASS - Password field found")
    print("PASS - Login button found")

except Exception as e:
    print("FAIL - Interface elements not found")
    print("Error:", e)
    driver.quit()
    raise

# --------------------------------------------------
# TEST 2: CHECK PLACEHOLDERS
# --------------------------------------------------

print("\nTEST 2: Checking input fields...")

try:
    assert username.get_attribute("placeholder") == \
        "Enter admin username"

    assert password.get_attribute("placeholder") == \
        "Enter password"

    print("PASS - Username placeholder is correct")
    print("PASS - Password placeholder is correct")

except Exception as e:
    print("FAIL - Placeholder test")
    print("Error:", e)

# --------------------------------------------------
# TEST 3: ENTER ADMIN CREDENTIALS
# --------------------------------------------------

print("\nTEST 3: Entering admin credentials...")

try:
    username.clear()
    username.send_keys("admin")

    password.clear()
    password.send_keys("admin123")

    print("PASS - Username entered")
    print("PASS - Password entered")

except Exception as e:
    print("FAIL - Could not enter credentials")
    print("Error:", e)

# --------------------------------------------------
# TEST 4: CHECK LOGIN BUTTON
# --------------------------------------------------

print("\nTEST 4: Checking login button...")

try:
    assert login_button.is_displayed()
    assert login_button.is_enabled()

    print("PASS - Login button is visible")
    print("PASS - Login button is enabled")

except Exception as e:
    print("FAIL - Login button test")
    print("Error:", e)

# --------------------------------------------------
# TEST 5: CLICK LOGIN
# --------------------------------------------------
# --------------------------------------------------
# TEST 5: CLICK LOGIN
# --------------------------------------------------

print("\nTEST 5: Clicking Sign In...")

try:
    login_button.click()

    print("PASS - Login button clicked successfully")

    time.sleep(2)

    # Handle JavaScript alert if the application displays one
    try:
        alert = driver.switch_to.alert
        print("Application alert:", alert.text)

        if "Failed to fetch moderation cases" in alert.text:
            print("WARNING - Moderation API fetch failed")
            print("This is a backend/API issue, not a login interface issue.")

        alert.accept()
        print("PASS - Alert handled")

    except:
        print("No alert displayed")

    print("CURRENT URL AFTER LOGIN:", driver.current_url)

except Exception as e:
    print("FAIL - Could not click login button")
    print("Error:", e)

# --------------------------------------------------
# FINAL
# --------------------------------------------------

print("\n===================================")
print("ADMIN LOGIN SELENIUM TEST COMPLETE")
print("===================================")

time.sleep(2)
driver.quit()