# Data Dictionary — AI Chatbot & RAG (Stitch Design Hardening)

## Entity: ColorToken
- name: string (CSS custom property name, e.g. "--bg-primary")
- value: string (hex, rgba, or hsl value)
- usage: "surface" | "accent" | "text" | "semantic"

### Stitch Color Tokens
| name              | value                              | usage   |
|-------------------|------------------------------------|---------|
| --surface-base    | #060e20                            | surface |
| --surface-raised  | #0c1630                            | surface |
| --surface-overlay | #121e3a                            | surface |
| --surface-hover   | #1a2847                            | surface |
| --primary         | #9aa8ff                            | accent  |
| --primary-hover   | #b3bfff                            | accent  |
| --primary-subtle  | rgba(154, 168, 255, 0.12)          | accent  |
| --tertiary        | #ac8aff                            | accent  |
| --tertiary-subtle | rgba(172, 138, 255, 0.10)          | accent  |
| --text-primary    | #e8e9ed                            | text    |
| --text-secondary  | #8b95a8                            | text    |
| --text-muted      | #5a6478                            | text    |
| --bubble-user     | #38485d                            | surface |
| --bubble-ai       | #192540                            | surface |
| --success         | #22c55e                            | semantic|
| --warning         | #eab308                            | semantic|
| --error           | #ef4444                            | semantic|

## Entity: FontToken
- family: string (CSS font-family stack)
- weight: number
- role: "headline" | "body" | "mono"

| family                                          | weight | role     |
|-------------------------------------------------|--------|----------|
| 'Manrope', system-ui, sans-serif                | 600    | headline |
| 'Inter', system-ui, sans-serif                  | 400    | body     |
| 'JetBrains Mono', 'Fira Code', monospace        | 400    | mono     |

## Entity: GlassEffect
- background: string (rgba with alpha 0.6-0.85)
- backdropFilter: string ("blur(16px)")
- boxShadow: string (subtle inner glow)
- appliesTo: string[] (component class names)

## Entity: SourceChip
- documentName: string
- score: number (0-1)
- display: "inline" (always visible, no toggle)

## Entity: ModelSelector
- position: "top-of-chat-main"
- currentModel: string
- demoMode: boolean

## Entity: AttachButton
- position: "left-of-text-input"
- triggerAction: "open file upload dialog"

## Relationships
- ColorToken --applied-to--> all CSS classes
- FontToken --applied-to--> headline elements (Manrope) and body elements (Inter)
- GlassEffect --applied-to--> SettingsPanel, MobileSidebarOverlay, ModelSelector
- SourceChip --replaces--> source-toggle-btn + collapsible sources-list
- ModelSelector --reads--> OllamaSettings.model, App.demoMode
- AttachButton --triggers--> same onUpload handler as DocumentUpload
