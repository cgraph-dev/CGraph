# ADR-006: Domain-Driven Design Feature Module Structure

## Status

**Accepted**

## Date

2026-01-13

## Authors

- @cgraph-dev/core-team

## Context

As CGraph grew from a small project to a multi-platform communication platform, the original flat
file structure became increasingly difficult to navigate and maintain. With teams working on web,
mobile, and backend simultaneously, we needed a structure that:

1. Allows teams to work independently on features
2. Promotes code reuse across platforms
3. Makes it easy to locate related code
4. Scales with team size and feature complexity

The previous structure organized code by technical layer (components, hooks, utils), which led to:

- Related code scattered across directories
- Difficulty understanding feature boundaries
- Merge conflicts when multiple teams touch shared directories
- Unclear ownership of code

## Decision Drivers

- **Team scalability**: Need to support 3+ teams working in parallel
- **Code discoverability**: Developers should find related code quickly
- **Platform parity**: Web and mobile should share as much logic as possible
- **Feature isolation**: Changes to one feature shouldn't break others
- **Onboarding speed**: New developers should understand the structure quickly

## Considered Options

### Option 1: Keep Layer-Based Structure

**Description**: Maintain the existing organization by technical layer.

```
src/
├── components/
├── hooks/
├── utils/
├── types/
└── services/
```

**Pros**:

- No migration effort
- Familiar to the team

**Cons**:

- Doesn't scale with team size
- Related code remains scattered
- Unclear feature boundaries

### Option 2: Feature-First with Colocation

**Description**: Organize by feature, colocating all related code.

```
src/features/
├── auth/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── types/
├── messaging/
└── forums/
```

**Pros**:

- Clear feature boundaries
- Easy to find related code
- Supports team ownership

**Cons**:

- Migration effort required
- Some shared code duplication

### Option 3: Full DDD with Shared Packages

**Description**: Feature modules in apps + shared domain logic in packages.

```
apps/web/src/features/
apps/mobile/src/features/
packages/core/          # Shared domain logic
packages/state/         # Shared state management
packages/ui/            # Shared components
```

**Pros**:

- Maximum code reuse
- Clear domain boundaries
- Platform-agnostic core logic
- Scales to large teams

**Cons**:

- Higher initial complexity
- Requires careful package API design
- More tooling needed

## Decision

We will adopt **Option 3: Full DDD with Shared Packages** because it provides the best foundation
for multi-platform development and team scaling.

### Implementation Notes

1. **Feature Modules in Apps**:
   - Each feature has: `components/`, `hooks/`, `screens/` (mobile), `pages/` (web)
   - Features are self-contained and can be lazy-loaded
   - Features import from shared packages, not from each other

2. **Shared Packages**:
   - `@cgraph/core`: Domain entities, services, validation
   - `@cgraph/state`: Zustand stores, shared state logic
   - `@cgraph/ui`: Platform-agnostic UI components
   - `@cgraph/utils`: Pure utility functions

3. **Dependency Flow**:

   ```
   apps/web ──┐
              ├──► packages/core
   apps/mobile┘    packages/state
                   packages/ui
   ```

4. **Migration Strategy**:
   - Phase 1: Create package structure ✅
   - Phase 2: Extract shared domain logic ✅
   - Phase 3: Reorganize app code into features ✅
   - Phase 4: Update imports and verify ✅

## Consequences

### Positive

- **Clear ownership**: Each feature can have designated maintainers
- **Parallel development**: Teams can work on different features without conflicts
- **Code reuse**: 60%+ of business logic shared between web and mobile
- **Faster onboarding**: New developers understand feature boundaries immediately
- **Better testing**: Features can be tested in isolation

### Negative

- **Initial learning curve**: Team needs to understand package boundaries
- **Build complexity**: More packages means more build configuration
- **Overhead for small changes**: Simple changes may touch multiple packages

### Risks

| Risk                  | Likelihood | Impact | Mitigation                              |
| --------------------- | ---------- | ------ | --------------------------------------- |
| Circular dependencies | Medium     | High   | Strict dependency rules, tooling checks |
| Over-abstraction      | Low        | Medium | Feature flags for gradual rollout       |
| Build time increase   | Medium     | Low    | Turborepo caching                       |

## Compliance

- [x] Security review completed
- [x] Performance impact assessed (build time acceptable)
- [x] Documentation updated (MONOREPO_CONVENTIONS.md)
- [x] Team notified

## Related

- Related documentation: MONOREPO_CONVENTIONS.md (project root)
- Related documentation: HOW_TO_CONNECT_NEW_COMPONENTS.md (project root)

## Notes

This structure is inspired by:

- Nx monorepo patterns
- Domain-Driven Design tactical patterns
- Feature-Sliced Design methodology

The structure should be reviewed annually or when significant scaling events occur.

---

_Accepted: January 2026_
