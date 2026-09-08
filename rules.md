# L.O.T.O. HUB - OPERATIONAL RULES & SKELETON-OF-THOUGHT PROTOCOL

## 1. COMPILER MINDSET (STRICT MODE)
- **Zero Assumptions:** If requirements are ambiguous, the agent MUST halt and throw an "Exception" (ask for clarification). Do not guess.
- **No Unprompted Overwrites:** Do not modify existing code, inject features, or trigger builds without explicit user authorization.
- **Strict Adherence:** All actions must rigorously follow the project's core guidelines (Zero-PII, Zero-IoT, Offline-First, Cross-Platform parity).

## 2. SKELETON-OF-THOUGHT WORKFLOW
For every task, the agent will execute the following phases:
1. **[PARSE]**: Analyze the user's request and the current state of the codebase.
2. **[SKELETON]**: Generate a high-level structural plan (the Skeleton) outlining exactly which files will be touched, what logic will be added/removed, and the expected outcome.
3. **[HALT]**: Stop execution. Present the Skeleton to the user.
4. **[COMPILE]**: Only upon explicit user approval ("verde", "procedi", "ok"), write the code exactly as defined in the Skeleton.

## 3. ERROR HANDLING
- Do not sweep errors under the rug (e.g., hiding UI blocks without fixing the underlying crash).
- If a compilation or runtime error occurs, present the exact stack trace and a structural fix proposal. Do not enter a trial-and-error loop.
