# Contracts — AI Chatbot & RAG (Stitch Design Hardening)

## C-1: Color Token Migration
- Input: index.css :root block with old color tokens
- Output: :root block with Stitch color tokens per Data Dictionary
- Precondition: :root block exists in index.css
- Postcondition: No reference to #0f1117, #161820, #1c1e2a, #232536, #6366f1 remains in :root; all Stitch tokens present
- Side effects: Every CSS rule referencing old custom properties now resolves to new values

## C-2: Border Elimination (No-Line Rule)
- Input: index.css with border declarations using "1px solid"
- Output: index.css where every "border: 1px solid" or "border-*: 1px solid" is replaced with tonal background shifts or box-shadow
- Precondition: Borders exist in index.css
- Postcondition: Zero occurrences of "1px solid" in index.css (except dashed drop-zone)
- Side effects: Visual separation maintained via background-color contrast

## C-3: Glassmorphism Application
- Input: .settings-panel, .sidebar-overlay CSS classes
- Output: Classes include backdrop-filter: blur(16px), rgba background, subtle box-shadow
- Precondition: Classes exist
- Postcondition: backdrop-filter property present on floating element classes
- Side effects: none

## C-4: Font Loading & Application
- Input: index.html without Google Fonts links
- Output: index.html with Manrope and Inter font links; CSS :root with updated font stacks
- Precondition: index.html exists
- Postcondition: Manrope and Inter fonts referenced in <head>; --font-headline and --font-body tokens in :root
- Side effects: Additional network requests for font files

## C-5: Chat Bubble Restyling
- Input: .bubble-user and .bubble-assistant CSS classes
- Output: .bubble-user background #38485d, no border; .bubble-assistant background #192540, no border
- Precondition: Classes exist in index.css
- Postcondition: Bubble backgrounds match Data Dictionary; no border property on bubble classes
- Side effects: none

## C-6: Source Chips (replace toggle)
- Input: MessageBubble component with toggle button + collapsible source list
- Output: MessageBubble shows SourceChip components inline below message content (always visible)
- Precondition: MessageBubble and SourceCitation components exist
- Postcondition: No source-toggle-btn rendered; source chips always visible when sources exist
- Side effects: SourceCitation component restyled as compact chip

## C-7: Model Selector Bar
- Input: ChatWindow component without model selector
- Output: ChatWindow renders a model selector bar at top of chat-main
- Precondition: ChatWindow receives demoMode prop; OllamaSettings accessible
- Postcondition: Model name or "Demo Mode" visible at top of chat area
- Side effects: New CSS classes for model-selector-bar

## C-8: Attach Button in Input
- Input: ChatWindow input-row without attach button
- Output: input-row has a paperclip/attach button that triggers file upload
- Precondition: onUpload prop available on ChatWindow
- Postcondition: Attach button visible left of textarea; clicking opens file dialog
- Side effects: New fileInputRef in ChatWindow for attach functionality

## C-9: Document Sidebar Polish
- Input: doc-panel and document-upload-section CSS with borders
- Output: Tonal separation, Manrope header, accent-colored drop zone on hover
- Precondition: doc-panel CSS exists
- Postcondition: No 1px solid borders on doc-panel or its children
- Side effects: none

## C-10: Headline Typography
- Input: All h2, h3, h4, sidebar-logo, empty-chat h2 CSS
- Output: font-family set to var(--font-headline) Manrope
- Precondition: Font loaded per C-4
- Postcondition: All headline selectors use Manrope
- Side effects: none
