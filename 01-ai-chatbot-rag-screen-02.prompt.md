# RAG Chatbot - Screen 02: Knowledge Lab Dashboard

## Overall Vibe
Welcoming, productive, research-focused. Emphasizes knowledge organization and document management. Clean asymmetric layout with context awareness on the right.

## Design System Block
- **Color**: Deep navy/slate backgrounds. Indigo blue accents (#7287FF, #bac3ff). Light text on dark. Green status indicators.
- **Typography**: Manrope for headlines, Inter for body, Space Grotesk for labels. Sizes: 48-52px headlines, 16-18px body, 12px labels.
- **Spacing**: Generous padding (24px), 8px component spacing. Three-column asymmetric grid.
- **Components**: 6px-8px border radius, glassmorphic effects, smooth gradients.

## Page Structure - Asymmetric Three-Column Layout

### Left Sidebar (256px)
- Navigation: Conversations, Library, History, Settings
- "New Research Session" button (gradient)
- Status indicator with progress bar ("12 Docs", "64 Documents Indexed")
- Upgrade and Log Out buttons at bottom

### Center Main Area (remaining minus 320px)
- Hero section: "Consult your Knowledge Lab" headline with gradient text
- Four suggested question cards in 2x2 grid
- Document Synthesis, Logic Extraction, Technical Review, Data Cross-Ref categories
- Empty state guidance at bottom
- Fixed bottom composer with text input and send button

### Right Panel (320px)
- "Active Context" header
- Recently indexed documents with status badges
- Document cards showing: filename, chunk count, processing status (green "Ready" or amber "Indexing...")
- File types: PDF, Markdown, Excel with appropriate icons
- "View All Sources" button at bottom