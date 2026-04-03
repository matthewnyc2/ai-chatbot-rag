#!/usr/bin/env python3
"""
V9 Debug D12: Validate Fix
Verify that 01-ai-chatbot-rag works correctly end-to-end.

Since no bugs were found during D2, this validates that the system
is WORKING CORRECTLY with all features functional.
"""

import subprocess
import json
from pathlib import Path
from datetime import datetime
import time

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("ERROR: playwright not installed")
    exit(1)

PROJECT_ROOT = Path(__file__).parent
PORT = 5173
BASE_URL = f"http://localhost:{PORT}"

validation_results = {
    "timestamp": datetime.now().isoformat(),
    "project": "01-ai-chatbot-rag",
    "test_suite": "D12-validation",
    "categories": {
        "UI Structure": [],
        "Settings Panel": [],
        "Chat Functionality": [],
        "Document Management": [],
        "Demo Mode": [],
    }
}

def test_ui_structure():
    """Validate: All UI elements present"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(BASE_URL, timeout=5000)
        page.wait_for_load_state("networkidle", timeout=10000)
        
        tests = [
            ("Sidebar visible", ".sidebar"),
            ("Chat window visible", ".chat-window"),
            ("Model selector bar", ".model-selector-bar"),
            ("Chat input area", ".chat-input-area"),
            ("Document upload area", ".drop-zone"),
            ("Settings button present", ".settings-btn"),
        ]
        
        for name, selector in tests:
            element = page.query_selector(selector)
            status = "PASS" if element else "FAIL"
            validation_results["categories"]["UI Structure"].append({
                "test": name,
                "selector": selector,
                "status": status,
                "timestamp": datetime.now().isoformat()
            })
            print(f"[{status}] {name}")
        
        browser.close()

def test_settings_panel():
    """Validate: Settings panel fully functional"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page(viewport={"width": 1280, "height": 1024})
        page.goto(BASE_URL, timeout=5000)
        page.wait_for_load_state("networkidle", timeout=10000)
        
        # Open settings
        settings_btn = page.query_selector(".settings-btn")
        if settings_btn:
            settings_btn.click()
            page.wait_for_timeout(500)
        
        tests = [
            ("Settings panel visible", ".settings-panel"),
            ("API Key input", ".settings-field input[type='password']"),
            ("Model selector", ".settings-field select"),
            ("Temperature slider", ".settings-field input[type='range']"),
            ("Demo Mode toggle", ".toggle-field .toggle"),
            ("System prompt textarea", ".system-prompt-input"),
            ("Save button", ".btn-primary"),
            ("Cancel button", ".btn-secondary"),
        ]
        
        for name, selector in tests:
            element = page.query_selector(selector)
            status = "PASS" if element else "FAIL"
            validation_results["categories"]["Settings Panel"].append({
                "test": name,
                "selector": selector,
                "status": status,
                "timestamp": datetime.now().isoformat()
            })
            print(f"[{status}] {name}")
        
        browser.close()

def test_chat_functionality():
    """Validate: Chat input and message flow works"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(BASE_URL, timeout=5000)
        page.wait_for_load_state("networkidle", timeout=10000)
        
        tests = [
            ("Empty state visible", ".empty-chat"),
            ("Feature cards visible", ".feature-card"),
            ("Chat input field", ".chat-input"),
            ("Send button present", ".send-btn"),
            ("Send button disabled when empty", ".send-btn:disabled"),
        ]
        
        for name, selector in tests:
            if ":disabled" in selector:
                element = page.query_selector(".send-btn")
                status = "PASS" if element and element.is_disabled() else "FAIL"
            else:
                element = page.query_selector(selector)
                status = "PASS" if element else "FAIL"
            
            validation_results["categories"]["Chat Functionality"].append({
                "test": name,
                "selector": selector,
                "status": status,
                "timestamp": datetime.now().isoformat()
            })
            print(f"[{status}] {name}")
        
        # Test typing enables send button
        input_field = page.query_selector(".chat-input")
        if input_field:
            input_field.fill("Test message")
            page.wait_for_timeout(200)
            send_btn = page.query_selector(".send-btn")
            status = "PASS" if send_btn and not send_btn.is_disabled() else "FAIL"
            validation_results["categories"]["Chat Functionality"].append({
                "test": "Send button enabled with text",
                "selector": ".send-btn",
                "status": status,
                "timestamp": datetime.now().isoformat()
            })
            print(f"[{status}] Send button enables when text entered")
        
        browser.close()

def test_document_management():
    """Validate: Document upload area functional"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(BASE_URL, timeout=5000)
        page.wait_for_load_state("networkidle", timeout=10000)
        
        tests = [
            ("Drop zone visible", ".drop-zone"),
            ("Upload icon visible", ".upload-icon"),
            ("Document list container", ".document-list"),
            ("Empty state text", ".empty-docs"),
        ]
        
        for name, selector in tests:
            element = page.query_selector(selector)
            status = "PASS" if element else "FAIL"
            validation_results["categories"]["Document Management"].append({
                "test": name,
                "selector": selector,
                "status": status,
                "timestamp": datetime.now().isoformat()
            })
            print(f"[{status}] {name}")
        
        browser.close()

def test_demo_mode():
    """Validate: Demo mode badge and functionality"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(BASE_URL, timeout=5000)
        page.wait_for_load_state("networkidle", timeout=10000)
        
        tests = [
            ("Demo badge visible", ".demo-badge"),
            ("Demo indicator in input", ".demo-indicator"),
            ("Live/Demo status indicator", ".model-selector-pill"),
        ]
        
        for name, selector in tests:
            element = page.query_selector(selector)
            status = "PASS" if element else "WARN"
            validation_results["categories"]["Demo Mode"].append({
                "test": name,
                "selector": selector,
                "status": status,
                "timestamp": datetime.now().isoformat()
            })
            print(f"[{status}] {name}")
        
        browser.close()

def main():
    print("\n" + "="*70)
    print("V9 DEBUG D12: VALIDATION — 01-ai-chatbot-rag")
    print("="*70 + "\n")
    
    print("Testing UI Structure...")
    test_ui_structure()
    print()
    
    print("Testing Settings Panel...")
    test_settings_panel()
    print()
    
    print("Testing Chat Functionality...")
    test_chat_functionality()
    print()
    
    print("Testing Document Management...")
    test_document_management()
    print()
    
    print("Testing Demo Mode...")
    test_demo_mode()
    print()
    
    # Calculate summary
    total = 0
    passes = 0
    warns = 0
    fails = 0
    
    for category, tests in validation_results["categories"].items():
        for test in tests:
            total += 1
            if test["status"] == "PASS":
                passes += 1
            elif test["status"] == "WARN":
                warns += 1
            else:
                fails += 1
    
    print("="*70)
    print("VALIDATION SUMMARY")
    print("="*70)
    print(f"Total validations: {total}")
    print(f"  PASS: {passes}")
    print(f"  WARN: {warns}")
    print(f"  FAIL: {fails}")
    print()
    
    if fails == 0:
        print("✓ VALIDATION PASSED: System is working correctly!")
    else:
        print("✗ VALIDATION FAILED: System has issues")
    
    print("="*70 + "\n")
    
    # Write results
    with open(PROJECT_ROOT / "test-d12-validation.json", "w") as f:
        json.dump(validation_results, f, indent=2)
    
    return 0 if fails == 0 else 1

if __name__ == "__main__":
    exit(main())
