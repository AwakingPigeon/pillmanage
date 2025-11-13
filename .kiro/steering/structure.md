---
inclusion: always
---

# Project Structure & Conventions

## Tech Stack
- React Native + Expo (managed workflow only - no native modifications)
- TypeScript, React Navigation
- State: Context API with reducer (`src/context/AppContext.tsx`)
- Storage: AsyncStorage via `src/services/storage.ts`
- Notifications: Expo Notifications via `src/services/notifications.ts`

## Directory Structure
```
DepressionMed/src/
├── context/        # AppContext.tsx (global state)
├── navigation/     # AppNavigator.tsx (tab config)
├── screens/        # Feature folders (medicine/, reminder/, history/)
├── services/       # Stateless business logic
└── types/          # index.ts (TypeScript definitions)
```

## Code Conventions

**Naming**: PascalCase for components/types, camelCase for services/functions

**Language**: Code in English, UI text in Chinese, root docs in Chinese

**Styling**: Use `StyleSheet.create()` only, never inline styles

**File Organization**: One component per file, co-locate feature screens, centralize types in `/types/`

## Core Types
- `Medicine`: `{ id, name, dosage, frequency, times[], startDate, endDate?, notes?, isActive }`
- `MedicationRecord`: `{ id, medicineId, scheduledTime, takenTime?, status, dosage, notes? }`
- `ReminderSettings`: `{ medicineId, enabled, advanceNotice, soundEnabled, vibrationEnabled, repeatInterval }`

## Development Workflow
1. New screens → `/screens/[feature]/`
2. Business logic → `/services/` (stateless)
3. State changes → Update AppContext reducer
4. New types → `/types/index.ts`
5. Navigation → Update `AppNavigator.tsx`

## Critical Rules
- All state through AppContext only
- AsyncStorage access only via `storage.ts`
- All user-facing text must be Chinese
- Bottom tabs: Medicine, Reminder, History, Settings
