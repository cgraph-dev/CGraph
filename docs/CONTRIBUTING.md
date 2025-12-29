# Contributing to CGraph

> "Write code like the next person to read it is a serial killer who knows where you live."  
> — Advice I wish I'd followed earlier

Thanks for considering contributing to CGraph! This document explains how we work together on this codebase. Please read it before your first PR—we promise it'll save everyone time.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Code Style Guide](#code-style-guide)
4. [Git Workflow](#git-workflow)
5. [Pull Request Process](#pull-request-process)
6. [Reporting Bugs](#reporting-bugs)
7. [Requesting Features](#requesting-features)
8. [Security Vulnerabilities](#security-vulnerabilities)

---

## Code of Conduct

We're all here to build something cool. Be kind, be patient with beginners, and remember that everyone was new once.

**Don't be that person who:**
- Leaves snarky comments on PRs
- Dismisses ideas without explanation
- Makes others feel stupid for asking questions
- Bikesheds on trivial formatting issues

**Do:**
- Give constructive feedback with examples
- Welcome newcomers and help them learn
- Assume good intent
- Focus on the code, not the person

If someone's being a jerk, let @lucas know privately.

---

## Getting Started

1. **Fork the repo** (unless you're a core contributor)
2. **Set up your environment** - See [QUICKSTART.md](./QUICKSTART.md)
3. **Find an issue to work on** - Look for `good first issue` or `help wanted` labels
4. **Comment on the issue** - Let us know you're working on it
5. **Create a branch** - Follow our naming conventions (below)
6. **Write your code** - Following our style guide
7. **Write tests** - We require tests for all new features
8. **Open a PR** - Use our template
9. **Address feedback** - We're usually pretty quick

---

## Code Style Guide

### TypeScript/JavaScript

We use Prettier for formatting (it runs on save), but here are some things Prettier can't catch:

```typescript
// ✅ Good: Descriptive names that explain intent
const unreadMessageCount = messages.filter(m => !m.readAt).length;
const isUserAuthenticated = !!currentUser && !currentUser.isGuest;

// ❌ Bad: Abbreviated names that make you think
const cnt = msgs.filter(m => !m.r).length;
const auth = !!u && !u.g;

// ✅ Good: Early returns for guard clauses
function getUser(id: string): User | null {
  if (!id) return null;
  if (!isValidUuid(id)) return null;
  
  return userCache.get(id) ?? fetchUser(id);
}

// ❌ Bad: Nested conditionals
function getUser(id: string): User | null {
  if (id) {
    if (isValidUuid(id)) {
      if (userCache.has(id)) {
        return userCache.get(id);
      } else {
        return fetchUser(id);
      }
    }
  }
  return null;
}

// ✅ Good: Explicit error handling
try {
  const response = await api.post('/messages', { content });
  return response.data;
} catch (error) {
  if (error instanceof ApiError && error.status === 429) {
    throw new RateLimitError('Too many messages, slow down!');
  }
  throw error; // Re-throw unexpected errors
}

// ❌ Bad: Swallowing errors
try {
  const response = await api.post('/messages', { content });
  return response.data;
} catch (error) {
  console.log('oops');
  return null; // Now the caller has no idea what happened
}
```

### React/Components

```tsx
// ✅ Good: Props interface with JSDoc
interface MessageListProps {
  /** The conversation to show messages from */
  conversationId: string;
  /** Called when user scrolls to load more */
  onLoadMore?: () => void;
  /** Maximum messages to display */
  limit?: number;
}

// ✅ Good: Destructure props, provide defaults
export function MessageList({
  conversationId,
  onLoadMore,
  limit = 50,
}: MessageListProps) {
  // ...
}

// ❌ Bad: props.whatever everywhere
export function MessageList(props) {
  return <div>{props.messages.map(m => ...)}</div>;
}

// ✅ Good: Custom hooks for logic
function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // fetch logic
  }, [conversationId]);
  
  return { messages, isLoading };
}

// Then in component:
function MessageList({ conversationId }: Props) {
  const { messages, isLoading } = useMessages(conversationId);
  // ...
}
```

### Elixir

We follow the standard Elixir style guide with a few additions:

```elixir
# ✅ Good: Pattern matching in function heads
def get_user(%{"id" => id}) when is_binary(id) do
  Repo.get(User, id)
end

def get_user(%{"username" => username}) when is_binary(username) do
  Repo.get_by(User, username: username)
end

def get_user(_), do: {:error, :invalid_params}

# ❌ Bad: Long if/else chains
def get_user(params) do
  if Map.has_key?(params, "id") do
    Repo.get(User, params["id"])
  else
    if Map.has_key?(params, "username") do
      Repo.get_by(User, username: params["username"])
    else
      {:error, :invalid_params}
    end
  end
end

# ✅ Good: Pipes for transformations
def format_message(message) do
  message
  |> Map.take([:id, :content, :sender_id, :inserted_at])
  |> Map.put(:formatted_at, format_timestamp(message.inserted_at))
  |> maybe_add_reactions(message)
end

# ❌ Bad: Nested function calls
def format_message(message) do
  maybe_add_reactions(
    Map.put(
      Map.take(message, [:id, :content, :sender_id, :inserted_at]),
      :formatted_at,
      format_timestamp(message.inserted_at)
    ),
    message
  )
end

# ✅ Good: with for complex operations that might fail
def send_message(user, conversation_id, content) do
  with {:ok, conversation} <- get_conversation(conversation_id),
       :ok <- authorize(user, conversation, :send_message),
       {:ok, message} <- create_message(user, conversation, content),
       :ok <- broadcast_message(message) do
    {:ok, message}
  else
    {:error, :not_found} -> {:error, "Conversation not found"}
    {:error, :unauthorized} -> {:error, "You can't send messages here"}
    {:error, changeset} -> {:error, format_errors(changeset)}
  end
end
```

### CSS/Tailwind

```tsx
// ✅ Good: Group related classes, use line breaks for readability
<button
  className={cn(
    // Layout
    "flex items-center justify-center gap-2",
    // Sizing
    "px-4 py-2 min-w-[120px]",
    // Appearance
    "rounded-lg bg-blue-600 text-white font-medium",
    // States
    "hover:bg-blue-700 focus:ring-2 focus:ring-blue-500",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    // Custom from props
    className
  )}
>

// ❌ Bad: One long unreadable line
<button className="flex items-center justify-center gap-2 px-4 py-2 min-w-[120px] rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
```

### Comments

Comments should explain **why**, not **what**:

```typescript
// ❌ Bad: Describes what the code does (we can read the code)
// Loop through messages and filter unread ones
const unread = messages.filter(m => !m.readAt);

// ✅ Good: Explains why this approach was chosen
// Using filter instead of reduce for readability—profile if this 
// becomes a bottleneck with large message counts
const unread = messages.filter(m => !m.readAt);

// ✅ Good: Documents a non-obvious behavior
// We debounce by 300ms because typing indicators should feel responsive
// but we don't want to spam the server on every keystroke
const debouncedTyping = useMemo(
  () => debounce(sendTypingIndicator, 300),
  [sendTypingIndicator]
);

// ✅ Good: Warns about gotchas
// IMPORTANT: Don't use useMemo here—the socket reference changes on
// reconnect and we WANT this effect to re-run when that happens
useEffect(() => {
  socket.on('message', handleMessage);
  return () => socket.off('message', handleMessage);
}, [socket, handleMessage]);
```

---

## Git Workflow

### Branch Naming

```
feature/123-add-voice-messages     # Feature with issue number
bugfix/456-fix-login-crash         # Bug fix with issue number
hotfix/critical-security-patch     # Emergency production fix
chore/update-dependencies          # Maintenance work
docs/improve-api-documentation     # Documentation only
refactor/extract-message-service   # Code restructuring
```

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add voice message recording
fix: resolve crash when sending empty message
docs: update API reference for v2 endpoints
style: format files with prettier
refactor: extract message validation to separate module
test: add integration tests for friend requests
chore: update dependencies to fix security warnings
```

**Good examples:**
```
feat(messaging): add support for message reactions

Users can now react to messages with emoji. Reactions are synced
in real-time via WebSocket.

Closes #123

---

fix(auth): prevent session fixation on login

Previously, we weren't regenerating the session ID after login,
which could allow session fixation attacks. Now we generate a
new session on every successful authentication.

Security: CVE-2024-XXXXX
```

**Bad examples:**
```
fix stuff                          # What stuff?
WIP                                # Don't commit WIP to main branch
Update User.tsx                    # What did you update?
asdfasdf                           # ...really?
```

### Keeping Your Branch Updated

```bash
# Before opening a PR, rebase on latest main
git fetch origin
git rebase origin/main

# If you have conflicts, resolve them and continue
git add .
git rebase --continue

# Force push your branch (only YOUR branch, never main)
git push --force-with-lease
```

---

## Pull Request Process

### Before Opening a PR

- [ ] Code compiles without errors
- [ ] All tests pass (`mix test`, `pnpm test`)
- [ ] New code has tests
- [ ] Code is formatted (`mix format`, `pnpm lint:fix`)
- [ ] You've tested manually in a browser/simulator
- [ ] You've rebased on latest main

### PR Template

When you open a PR, fill out this template:

```markdown
## What does this PR do?

Brief description of the change.

## Why is this needed?

Context on why we're making this change.

## How to test

Steps for reviewers to verify the change works:
1. Go to...
2. Click on...
3. Observe that...

## Screenshots (if UI changes)

Before | After
-------|------
![before](url) | ![after](url)

## Checklist

- [ ] Tests added/updated
- [ ] Documentation updated (if needed)
- [ ] No console.logs or debug code left in
- [ ] Tested on mobile (if applicable)

## Related Issues

Closes #123
```

### Review Process

1. **All PRs require at least one approval** from a core contributor
2. **CI must pass** before merging
3. **Address all comments** before requesting re-review
4. **Squash and merge** for clean history (we handle this)

### Responding to Feedback

- Don't take it personally—we're reviewing code, not you
- If you disagree, explain your reasoning
- If you agree, make the change and reply "Done" or "Fixed in abc123"
- Use "Resolve conversation" when you've addressed feedback

---

## Reporting Bugs

Found a bug? Here's how to report it:

### Bug Report Template

```markdown
## Bug Description

A clear description of what the bug is.

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior

What you expected to happen.

## Actual Behavior

What actually happened.

## Screenshots

If applicable, add screenshots.

## Environment

- OS: [e.g., macOS 14.2]
- Browser: [e.g., Chrome 120]
- App Version: [e.g., commit abc123]

## Additional Context

Any other relevant information.
```

### What Makes a Good Bug Report

✅ **Reproducible** - We can follow your steps and see the bug  
✅ **Specific** - "Login fails" is bad, "Login fails when password contains emoji" is good  
✅ **Contextual** - Include error messages, screenshots, browser console output  
✅ **Isolated** - Try to narrow down what causes the bug  

---

## Requesting Features

Have an idea? We'd love to hear it!

### Feature Request Template

```markdown
## Problem Statement

What problem does this feature solve? Who is affected?

## Proposed Solution

Your idea for how to solve it.

## Alternatives Considered

Other ways you thought about solving this.

## Additional Context

Mockups, examples from other apps, user research, etc.
```

### Feature Review Process

1. **Submit your idea** as a GitHub issue
2. **Discussion** happens in the issue comments
3. **Core team votes** on whether to include in roadmap
4. **If approved**, issue gets labels and priority
5. **Implementation** can begin (by you or anyone!)

Features we're especially interested in:
- Accessibility improvements
- Performance optimizations
- Security enhancements
- Mobile-specific features

---

## Security Vulnerabilities

**DO NOT report security vulnerabilities as GitHub issues!**

Instead, email **security@cgraph.app** with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Any suggested fixes (optional)

We'll respond within 48 hours and work with you on:
- Confirming the vulnerability
- Developing a fix
- Coordinating disclosure
- Crediting you (if you want)

We don't have a formal bug bounty program yet, but we'll send you swag and eternal gratitude.

---

## Development Tips

### Debugging Elixir

```elixir
# Add to any function to inspect values
def some_function(arg) do
  IO.inspect(arg, label: "arg value")
  
  # Or use IEx.pry for interactive debugging
  # (remember to remove before committing!)
  require IEx; IEx.pry()
  
  # ... rest of function
end
```

### Debugging React

```typescript
// React DevTools is your friend—install the browser extension

// For performance issues, use React's Profiler
<Profiler id="MessageList" onRender={logRender}>
  <MessageList />
</Profiler>

// For state debugging, add this to your store
if (process.env.NODE_ENV === 'development') {
  // @ts-ignore
  window.__store = store;
}
// Now you can inspect state in browser console: __store.getState()
```

### Testing Locally

```bash
# Run a specific test file
mix test test/cgraph/messaging_test.exs

# Run a specific test by line number
mix test test/cgraph/messaging_test.exs:42

# Run tests matching a pattern
mix test --only focus  # runs tests tagged with @tag :focus

# Watch mode (rerun on file change)
mix test.watch
```

---

## Getting Help

Stuck on something?

1. **Check existing issues** - Someone might have had the same problem
2. **Search Slack** - Lots of tribal knowledge there
3. **Ask in #dev-help** - We're friendly, promise
4. **Pair with someone** - Sometimes two brains are better than one

Don't struggle alone for hours. If you've been stuck for 30 minutes, ask for help. We've all been there.

---

## Recognition

We believe in giving credit where it's due:

- **Contributors page** - Your name appears on our website
- **Changelog mentions** - Significant contributions get called out
- **Swag** - Stickers and t-shirts for major contributions
- **Core contributor status** - After sustained contributions

---

## Thank You

Seriously, thank you for reading this far. Contributing to open source can be intimidating, and we appreciate you taking the time to do it right.

Now go write some code! 🚀

---

