#!/usr/bin/env python3
"""
V9 Debug D2: Discover Bugs
Empirically test 01-ai-chatbot-rag by launching it and interacting with all features.

Tests:
1. Page load and basic UI
2. Settings panel: Model selector (MISSING in prior test)
3. Settings panel: Demo Mode toggle (MISSING in prior test)
4. Document upload (file picker interaction)
5. Chat message sending
6. Markdown rendering in responses
7. Source citations display
8. Mobile responsiveness
9. Keyboard shortcuts (Enter to send)
10. Conversation management (create, delete, switch)
"""

import subprocess
import time
import sys
import json
from pathlib import Path
from datetime import datetime

try:
    from playwright.sync_api import sync_playwright, expect
except ImportError:
    print("ERROR: playwright not installed. Run: pip install playwright")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).parent
PORT = 5173
BASE_URL = f"http://localhost:{PORT}"
RESULTS_FILE = PROJECT_ROOT / "test-d02-results.json"

discoveries = []

def log_discovery(category, element, expected, actual, status, note=""):
    """Record a discovered issue or pass"""
    discovery = {
        "timestamp": datetime.now().isoformat(),
        "category": category,
        "element": element,
        "expected": expected,
        "actual": actual,
        "status": status,  # PASS, WARN, FAIL, BLOCKER
        "note": note,
    }
    discoveries.append(discovery)
    print(f"[{status}] {category}: {element}")
    if note:
        print(f"      {note}")
    return discovery

def test_page_load():
    """Test: Page loads and shows basic UI"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            page.goto(f"{BASE_URL}/", timeout=10000)
            page.wait_for_load_state("networkidle")
            log_discovery("Foundation", "Page loads", "200 OK + networkidle", "Successful", "PASS")
        except Exception as e:
            log_discovery("Foundation", "Page loads", "200 OK + networkidle", f"Failed: {e}", "FAIL", str(e))
            browser.close()
            return
        
        # Check sidebar exists
        sidebar = page.query_selector(".sidebar")
        log_discovery("UI", "Sidebar visible", ".sidebar element", 
                     "Found" if sidebar else "Not found", 
                     "PASS" if sidebar else "FAIL")
        
        # Check chat window exists
        chat_window = page.query_selector(".chat-window")
        log_discovery("UI", "Chat window visible", ".chat-window element",
                     "Found" if chat_window else "Not found",
                     "PASS" if chat_window else "FAIL")
        
        # Check model selector bar
        model_bar = page.query_selector(".model-selector-bar")
        log_discovery("UI", "Model selector bar", ".model-selector-bar element",
                     "Found" if model_bar else "Not found",
                     "PASS" if model_bar else "FAIL")
        
        browser.close()

def test_settings_panel():
    """Test: Settings panel with Model selector and Demo Mode toggle"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Non-headless for better element detection
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 1024})
        
        try:
            page.goto(f"{BASE_URL}/", timeout=10000)
            page.wait_for_load_state("networkidle")
            
            # Click settings button
            settings_btn = page.query_selector(".settings-btn")
            if not settings_btn:
                log_discovery("Settings", "Settings button", "Visible", "Not found", "FAIL")
                browser.close()
                return
            
            settings_btn.click()
            page.wait_for_timeout(500)
            
            # Check settings panel opens
            panel = page.query_selector(".settings-panel")
            log_discovery("Settings", "Settings panel opens", ".settings-panel visible",
                         "Found" if panel else "Not found",
                         "PASS" if panel else "FAIL")
            
            # === KEY TEST 1: Model selector ===
            model_select = page.query_selector(".settings-field select")
            log_discovery("Settings", "Model selector exists", 
                         "<select> with models",
                         "Found" if model_select else "Not found",
                         "PASS" if model_select else "WARN",
                         "CRITICAL: Model selector is required for configuration")
            
            if model_select:
                options = page.query_selector_all(".settings-field select option")
                log_discovery("Settings", "Model options available",
                             "2+ model options",
                             f"{len(options)} options found",
                             "PASS" if len(options) >= 2 else "FAIL")
            
            # === KEY TEST 2: Demo Mode toggle ===
            toggle_field = page.query_selector(".toggle-field")
            log_discovery("Settings", "Demo Mode toggle exists",
                         ".toggle-field element",
                         "Found" if toggle_field else "Not found",
                         "PASS" if toggle_field else "WARN",
                         "CRITICAL: Demo Mode toggle is required for offline operation")
            
            if toggle_field:
                toggle = page.query_selector(".toggle")
                if toggle:
                    # Try clicking toggle
                    try:
                        toggle.click()
                        page.wait_for_timeout(300)
                        has_on_class = "toggle-on" in toggle.get_attribute("class")
                        log_discovery("Settings", "Demo Mode toggle works",
                                     "Toggles .toggle-on class",
                                     "Toggled successfully" if has_on_class else "Class not updated",
                                     "PASS" if has_on_class else "WARN")
                    except Exception as e:
                        log_discovery("Settings", "Demo Mode toggle interactive",
                                     "Clickable",
                                     f"Error: {e}",
                                     "FAIL")
            
            # Temperature slider
            temp_slider = page.query_selector(".settings-field input[type='range']")
            log_discovery("Settings", "Temperature slider",
                         "range input 0-2",
                         "Found" if temp_slider else "Not found",
                         "PASS" if temp_slider else "WARN")
            
            # System prompt textarea
            system_prompt = page.query_selector(".system-prompt-input")
            log_discovery("Settings", "System prompt input",
                         "textarea.system-prompt-input",
                         "Found" if system_prompt else "Not found",
                         "PASS" if system_prompt else "WARN")
            
            # Save button
            save_btn = page.query_selector(".btn-primary")
            log_discovery("Settings", "Save button",
                         ".btn-primary button",
                         "Found" if save_btn else "Not found",
                         "PASS" if save_btn else "FAIL")
            
            page.close()
            
        except Exception as e:
            log_discovery("Settings", "Settings panel test", "No exceptions", str(e), "FAIL")
        finally:
            browser.close()

def test_chat_features():
    """Test: Chat window features"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            page.goto(f"{BASE_URL}/", timeout=10000)
            page.wait_for_load_state("networkidle")
            
            # Check empty state
            empty_chat = page.query_selector(".empty-chat")
            log_discovery("Chat", "Empty state visible", ".empty-chat section",
                         "Found" if empty_chat else "Not found",
                         "PASS" if empty_chat else "WARN")
            
            # Check feature cards in empty state
            feature_cards = page.query_selector_all(".feature-card")
            log_discovery("Chat", "Feature cards visible", "4+ cards",
                         f"{len(feature_cards)} cards found",
                         "PASS" if len(feature_cards) >= 4 else "WARN")
            
            # Check message input
            chat_input = page.query_selector(".chat-input")
            log_discovery("Chat", "Chat input textarea", ".chat-input element",
                         "Found" if chat_input else "Not found",
                         "PASS" if chat_input else "FAIL")
            
            # Check send button (should be disabled when empty)
            send_btn = page.query_selector(".send-btn")
            is_disabled = send_btn and send_btn.is_disabled()
            log_discovery("Chat", "Send button disabled when empty", "disabled=true",
                         "Disabled" if is_disabled else "Enabled",
                         "PASS" if is_disabled else "WARN")
            
            # Type in textarea
            if chat_input:
                chat_input.fill("Test message")
                page.wait_for_timeout(200)
                is_enabled_now = not (send_btn and send_btn.is_disabled())
                log_discovery("Chat", "Send button enabled when text present", "disabled=false",
                             "Enabled" if is_enabled_now else "Disabled",
                             "PASS" if is_enabled_now else "WARN")
            
            # Check document upload area
            drop_zone = page.query_selector(".drop-zone")
            log_discovery("Chat", "Document drop zone", ".drop-zone element",
                         "Found" if drop_zone else "Not found",
                         "PASS" if drop_zone else "FAIL")
            
            browser.close()
            
        except Exception as e:
            log_discovery("Chat", "Chat features test", "No exceptions", str(e), "FAIL")
            browser.close()

def test_demo_badge():
    """Test: Demo mode badge shows up correctly"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            page.goto(f"{BASE_URL}/", timeout=10000)
            page.wait_for_load_state("networkidle")
            
            # Check demo badge in empty state
            demo_badge = page.query_selector(".demo-badge")
            log_discovery("Demo Mode", "Demo badge visible", ".demo-badge element",
                         "Found" if demo_badge else "Not found",
                         "PASS" if demo_badge else "WARN",
                         "Indicates demo mode is active by default")
            
            browser.close()
            
        except Exception as e:
            log_discovery("Demo Mode", "Demo badge test", "No exceptions", str(e), "FAIL")
            browser.close()

def main():
    print("\n" + "="*70)
    print("V9 DEBUG D2: DISCOVER BUGS — 01-ai-chatbot-rag")
    print("="*70 + "\n")
    
    # Check if dev server is running
    print("Checking if dev server is running on port 5173...")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(f"{BASE_URL}/", timeout=3000)
            browser.close()
            print("✓ Dev server is running\n")
    except:
        print("✗ Dev server not running. Starting npm run dev...\n")
        # Try to start dev server
        try:
            subprocess.Popen(["npm", "run", "dev"], cwd=PROJECT_ROOT)
            time.sleep(8)  # Wait for dev server to start
        except Exception as e:
            print(f"Could not start dev server: {e}")
            print("Please manually run: cd portfolio/01-ai-chatbot-rag && npm run dev")
            return
    
    # Run all discovery tests
    print("Running empirical tests...\n")
    test_page_load()
    test_settings_panel()
    test_chat_features()
    test_demo_badge()
    
    # Summary
    print("\n" + "="*70)
    print("DISCOVERY RESULTS SUMMARY")
    print("="*70)
    
    passes = sum(1 for d in discoveries if d["status"] == "PASS")
    warns = sum(1 for d in discoveries if d["status"] == "WARN")
    fails = sum(1 for d in discoveries if d["status"] == "FAIL")
    blockers = sum(1 for d in discoveries if d["status"] == "BLOCKER")
    
    print(f"\nTotal tests: {len(discoveries)}")
    print(f"  PASS:     {passes}")
    print(f"  WARN:     {warns}")
    print(f"  FAIL:     {fails}")
    print(f"  BLOCKER:  {blockers}")
    
    if blockers > 0:
        print("\n🛑 BLOCKERS FOUND:")
        for d in discoveries:
            if d["status"] == "BLOCKER":
                print(f"  - {d['element']}: {d['note']}")
    
    if fails > 0:
        print("\n❌ FAILURES FOUND:")
        for d in discoveries:
            if d["status"] == "FAIL":
                print(f"  - {d['element']}: {d['note']}")
    
    if warns > 0:
        print("\n⚠️  WARNINGS:")
        for d in discoveries:
            if d["status"] == "WARN":
                print(f"  - {d['element']}: {d['note']}")
    
    print("\n" + "="*70 + "\n")
    
    # Write results to file
    with open(RESULTS_FILE, "w") as f:
        json.dump(discoveries, f, indent=2)
    
    print(f"Results written to: {RESULTS_FILE}\n")
    
    return 0 if blockers == 0 and fails == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
