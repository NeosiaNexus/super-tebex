# @neosia/tebex-nextjs

Tebex Headless SDK for Next.js App Router with TanStack Query and Zustand.

## Tech Stack

- **Runtime**: Bun (package manager + build)
- **Framework**: React 18/19 + Next.js 14/15 App Router
- **State**: TanStack Query v5 (server state) + Zustand v5 (client state)
- **TypeScript**: Strict mode, zero `any` tolerance
- **Testing**: Vitest + MSW + Testing Library
- **API**: tebex_headless SDK wrapper

## Project Structure

```
src/
├── provider/     # TebexProvider (QueryClient + Context)
├── hooks/        # React hooks (useBasket, useCategories, etc.)
├── queries/      # TanStack Query keys factory
├── services/     # API wrapper (tebex_headless)
├── stores/       # Zustand stores (basket, user)
├── errors/       # TebexError class + error codes
└── types/        # TypeScript types, guards, Result<T,E>
```

## Commands

```bash
bun install          # Install dependencies
bun run build        # Build for production
bun run typecheck    # TypeScript check (MUST pass)
bun run lint         # ESLint with auto-fix
bun run test         # Run tests
bun run coverage     # Tests with coverage (target: 90%+)
```

## TypeScript Rules

**CRITICAL: Zero `any` policy enforced by ESLint.**

- Use `unknown` + type guards instead of `any`
- Explicit return types on exported functions
- Strict null checks enabled
- Use `Result<T, E>` pattern for error handling

```typescript
// GOOD
function parse(input: unknown): Result<Data, TebexError> {
  if (!isValidData(input)) {
    return err(new TebexError(TebexErrorCode.INVALID_CONFIG));
  }
  return ok(input);
}

// BAD - Never do this
function parse(input: any): any { ... }
```

## Hook Patterns

All hooks follow this structure:

```typescript
interface UseXxxReturn {
  data: T | null;
  isLoading: boolean;
  isFetching: boolean;
  error: TebexError | null;
  errorCode: TebexErrorCode | null;
  refetch: () => Promise<unknown>;
}
```

- Query hooks use `tebexKeys` factory for cache keys
- Mutations invalidate relevant queries via `queryClient.invalidateQueries()`
- Errors are wrapped in `TebexError.fromUnknown()`

## Error Handling

Use `TebexErrorCode` enum - never hardcode error messages:

```typescript
// GOOD
throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);

// BAD
throw new Error("Basket not found");
```

## Testing

- MSW handlers in `__tests__/mocks/handlers.ts`
- Test wrapper with TebexProvider in `__tests__/utils/test-utils.tsx`
- Coverage threshold: 90%+ (currently ~94%)
- **NEVER** use timing-based tests (setTimeout, delays) - they are flaky

```typescript
// Test pattern
const { result } = renderHook(() => useCategories(), { wrapper });
await waitFor(() => expect(result.current.isLoading).toBe(false));
expect(result.current.categories).toHaveLength(1);
```

## Commit Convention

Use Conventional Commits:

```
feat: add useGiftPackage hook
fix: handle basket expiration error
test: increase coverage for useCheckout
refactor: simplify TebexProvider context
docs: update migration guide
chore: update dependencies
```

## Anti-Patterns to Avoid

- **No `any`** - Use `unknown` with type guards
- **No hardcoded strings** - Use TebexErrorCode enum
- **No timing tests** - Use waitFor() with conditions
- **No unused exports** - Tree-shake everything
- **No implicit returns** - Always explicit for public API
- **No floating promises** - Always await or handle
- **No console.log** - ESLint enforces this

## Architecture Notes

- Provider pattern: All hooks require `TebexProvider` ancestor
- Zustand stores are persisted (localStorage) for basket/user
- QueryClient is created once per TebexProvider instance
- DevTools NOT included (consumers add their own to avoid jsxDEV production errors)
- Hooks expose `errorCode` for i18n-friendly error handling
- Build uses `NODE_ENV=production` to force production JSX runtime

## Before Committing

```bash
bun run typecheck && bun run lint && bun run coverage
```

All three MUST pass. Coverage must stay above 90%.
