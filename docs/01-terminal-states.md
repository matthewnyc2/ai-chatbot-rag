# Terminal States — AI Chatbot & RAG (Stitch Design Hardening)

## North Star
A prospect viewing my Upwork profile sees this AI Chatbot demo, is impressed by both
the functionality and the visual design, and is confident I can build AI/RAG systems.

## TS-1: Dark Surface Background
The page background color is #060e20. All surface-level containers use tonal variants
of this color. No pure black (#000) appears.

## TS-2: Accent Colors — Primary & Tertiary
The primary accent is #9aa8ff (violet-blue). The tertiary accent is #ac8aff.
Interactive elements (buttons, focus rings, active states) use primary.
Decorative/gradient elements use tertiary as a secondary gradient stop.

## TS-3: No-Line Rule
No element has a 1px solid border. Visual separation uses tonal shifts
(background-color changes of 4-8% lightness), box-shadows, or subtle rgba overlays.

## TS-4: Glassmorphism on Floating Elements
Settings panel, mobile sidebar overlay, and any floating dropdown use glassmorphism:
background rgba with alpha 0.6-0.85, backdrop-filter blur(16px), subtle inner glow via
box-shadow.

## TS-5: Typography — Manrope Headlines, Inter Body
Headlines (h1-h4, sidebar logo, empty-chat title) use Manrope 600.
Body text and UI labels use Inter 400/500. Both loaded via Google Fonts link in
index.html.

## TS-6: Chat Bubble Colors
User message bubbles have background #38485d. AI message bubbles have background #192540.
Neither bubble has a visible border. User bubble text is white. AI bubble text is
--text-primary (#e8e9ed).

## TS-7: RAG Source Chips
After each AI response that has sources, source chips appear directly below the message
content (no toggle/expand required). Each chip is a compact inline element showing the
document name and relevance score, styled with the tertiary accent.

## TS-8: Model Selector at Top of Chat
A dropdown/selector appears at the top of the chat main area showing the current model
name. In demo mode it shows "Demo Mode". The selector uses glassmorphism styling.

## TS-9: Attach Button in Message Input
The input row includes an attach/paperclip button to the left of the text input. Clicking
it triggers the file upload dialog (same as the document panel upload).

## TS-10: Document Sidebar Visual Polish
The document sidebar on the left uses the dark surface palette with tonal separation
(no borders), the section header uses Manrope, and the drop zone uses a dashed outline
with the primary accent on hover.
