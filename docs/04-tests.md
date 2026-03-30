# Tests — AI Chatbot & RAG (Stitch Design Hardening)

These are visual/structural tests. Each can be verified by inspecting the built CSS/HTML.

## T-1: Color Token Migration
- PASS: :root in index.css contains --surface-base: #060e20
- PASS: :root in index.css contains --primary: #9aa8ff
- PASS: :root in index.css contains --tertiary: #ac8aff
- PASS: :root in index.css contains --bubble-user: #38485d
- PASS: :root in index.css contains --bubble-ai: #192540
- FAIL if: any of #0f1117, #161820, #6366f1 appear in :root

## T-2: Border Elimination
- PASS: grep for "border: 1px solid" in index.css returns zero matches (excluding dashed)
- PASS: grep for "border-right: 1px solid" returns zero
- PASS: grep for "border-bottom: 1px solid" returns zero
- PASS: grep for "border-top: 1px solid" returns zero
- PASS: grep for "border-left: 1px solid" returns zero (excluding md-blockquote left accent)
- EDGE: md-blockquote has "border-left: 3px solid" — this is intentional, not 1px

## T-3: Glassmorphism
- PASS: .settings-panel has "backdrop-filter: blur"
- PASS: .settings-panel background uses rgba with alpha < 1

## T-4: Font Loading
- PASS: index.html contains "fonts.googleapis.com" with "Manrope" and "Inter"
- PASS: :root contains --font-headline with 'Manrope'
- PASS: :root contains --font-body with 'Inter'

## T-5: Chat Bubble Colors
- PASS: .bubble-user background references --bubble-user
- PASS: .bubble-assistant background references --bubble-ai
- PASS: Neither .bubble-user nor .bubble-assistant has a border property

## T-6: Source Chips
- PASS: MessageBubble.tsx does not contain "source-toggle-btn"
- PASS: MessageBubble.tsx renders source chips when sources exist
- PASS: .source-chip class exists in index.css

## T-7: Model Selector
- PASS: ChatWindow.tsx renders an element with class "model-selector-bar"
- PASS: .model-selector-bar class exists in index.css

## T-8: Attach Button
- PASS: ChatWindow.tsx renders a button with class "attach-btn" inside input-row
- PASS: .attach-btn class exists in index.css

## T-9: Document Sidebar Polish
- PASS: .doc-panel has no "border" property with "1px solid"
- PASS: .document-item has no "border" property with "1px solid"

## T-10: Headline Typography
- PASS: .sidebar-logo has font-family referencing --font-headline or Manrope
- PASS: .empty-chat h2 has font-family referencing --font-headline or Manrope
- PASS: h3, h4 selectors have font-family referencing --font-headline or Manrope
