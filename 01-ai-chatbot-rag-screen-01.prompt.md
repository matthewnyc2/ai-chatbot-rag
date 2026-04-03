# RAG Chatbot - Screen 01: Chat Conversation Interface

## Overall Vibe
Dark theme, modern, productive. Minimal distractions. Focus on content. Emphasis on conversation flow with source attribution.

## Design System Block
- **Color**: Dark charcoal background (#131313). Text white/light gray. Accent blue (#2E5BFF) for user messages, muted gold/tan for AI responses.
- **Typography**: Clean sans-serif. Headers 18px bold (Manrope), body 14px regular (Inter), mono code blocks 12px.
- **Spacing**: 16px margins, 8px internal padding. Compact but breathable.
- **Components**: Rounded corners (6px), subtle shadows, smooth transitions.

## Page Structure - Left-to-Right Layout

### Left Sidebar (200px)
- Top: "Chat History" label
- Below: vertical list of conversation threads, each as a button with truncated text
- Bottom: "New Conversation" button and Settings/Logout options
- Dark background, slightly lighter than canvas

### Right Main Area (remaining width)
- **Top Bar**: "Current Conversation" title, settings gear icon right-aligned
- **Chat Stream**: Scrollable messages area
  - User messages: right-aligned, blue background, rounded, with timestamps
  - AI messages: left-aligned, gold/tan background, rounded, with colored signature bar
  - Each message shows: text content, timestamp below
  - AI messages include "Show N sources" button for citations
- **Bottom Input**: Text input field (full width) with placeholder "Ask a question...", send button (blue) on right