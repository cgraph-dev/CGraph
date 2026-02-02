# Component Refactoring Plan

## Objective

Break down large components (>500 lines) into smaller, focused, testable units.

## Target Components by Size

| File                      | Lines | Target | Strategy                                              |
| ------------------------- | ----- | ------ | ----------------------------------------------------- |
| CustomizationDemo.tsx     | 3510  | 500    | Split into 7 section components                       |
| Conversation.tsx          | 2092  | 400    | Extract MessageList, MessageInput, ConversationHeader |
| IdentityCustomization.tsx | 1586  | 400    | Split into 4 tab-specific components                  |
| HolographicUIv4.tsx       | 1579  | 300    | Extract individual effect components                  |
| ForumAdmin.tsx            | 1559  | 400    | Split by admin section (users, posts, settings)       |
| CustomEmojiPicker.tsx     | 1421  | 300    | Extract category selector, search, preview            |
| Settings.tsx              | 1415  | 300    | Extract SettingsSection components                    |
| EffectsCustomization.tsx  | 1372  | 400    | Split by effect type                                  |

## Refactoring Patterns

### 1. Container/Presenter Pattern

```typescript
// Before: One massive component
function Settings() {
  const [state, setState] = useState();
  // 1000+ lines of JSX
}

// After: Container + focused presenters
function SettingsContainer() {
  const settingsState = useSettingsState(); // Custom hook
  return (
    <SettingsLayout>
      <AccountSettings {...settingsState.account} />
      <PrivacySettings {...settingsState.privacy} />
      <ThemeSettings {...settingsState.theme} />
    </SettingsLayout>
  );
}
```

### 2. Custom Hook Extraction

```typescript
// Before: Logic in component
function Conversation() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  // 50 lines of message handling logic

  return <div>...</div>;
}

// After: Logic in hook
function useConversationState(conversationId: string) {
  // All state and logic here
  return { messages, input, actions };
}

function Conversation() {
  const { messages, input, actions } = useConversationState(id);
  return <ConversationView messages={messages} {...actions} />;
}
```

### 3. Compound Component Pattern

```typescript
// For related components that work together
const EmojiPicker = {
  Root: EmojiPickerRoot,
  Search: EmojiPickerSearch,
  Categories: EmojiPickerCategories,
  Grid: EmojiPickerGrid,
  Preview: EmojiPickerPreview,
};

// Usage
<EmojiPicker.Root>
  <EmojiPicker.Search />
  <EmojiPicker.Categories />
  <EmojiPicker.Grid />
  <EmojiPicker.Preview />
</EmojiPicker.Root>
```

## Priority Extraction

### High Priority (Most Used)

1. **Conversation.tsx** → Already partially done with ConversationHeader
   - Extract: `MessageList`, `MessageInput`, `MessageBubble`, `TypingIndicator`
   - Hook: `useConversationActions`

2. **Settings.tsx** → User-facing, needs maintainability
   - Extract: `AccountSection`, `PrivacySection`, `SecuritySection`, `ThemeSection`
   - Hook: `useSettingsSync`

### Medium Priority (Admin/Power User)

3. **ForumAdmin.tsx** → Complex admin interface
   - Extract: `UserManagement`, `ContentModeration`, `ForumSettings`

4. **CustomEmojiPicker.tsx** → Reusable component
   - Extract: `EmojiSearch`, `EmojiCategoryList`, `EmojiGrid`

### Lower Priority (Demo/Landing)

5. **CustomizationDemo.tsx** → Demo page, less critical
6. **LandingDemo.tsx** → Marketing page
7. **HolographicUIv4.tsx** → Effect showcase

## File Structure After Refactoring

```
components/
├── conversation/
│   ├── index.ts              # Exports
│   ├── ConversationContainer.tsx
│   ├── MessageList.tsx
│   ├── MessageBubble.tsx
│   ├── MessageInput.tsx
│   ├── TypingIndicator.tsx
│   └── hooks/
│       ├── useConversation.ts
│       └── useMessageSend.ts
│
├── settings/
│   ├── index.ts
│   ├── SettingsLayout.tsx
│   ├── AccountSettings.tsx
│   ├── PrivacySettings.tsx
│   ├── SecuritySettings.tsx
│   ├── ThemeSettings.tsx
│   └── hooks/
│       └── useSettingsSync.ts
│
└── emoji-picker/
    ├── index.ts
    ├── EmojiPicker.tsx
    ├── EmojiSearch.tsx
    ├── EmojiCategories.tsx
    ├── EmojiGrid.tsx
    └── EmojiPreview.tsx
```

## Progress Tracking

- [ ] Conversation.tsx refactored
- [ ] Settings.tsx refactored
- [ ] ForumAdmin.tsx refactored
- [ ] CustomEmojiPicker.tsx refactored
- [ ] IdentityCustomization.tsx refactored
- [ ] EffectsCustomization.tsx refactored
- [ ] Large demo components refactored

## Success Metrics

- All component files < 500 lines
- Each component has single responsibility
- Hooks extracted for reusable logic
- Test files created for extracted components
- No regression in functionality
