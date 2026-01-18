# External Components

This folder is for importing and adapting components from external UI libraries like:

- **[21st.dev](https://21st.dev)** - Modern UI components
- **[reactbits.dev](https://reactbits.dev)** - React component library
- **[Magic UI](https://magicui.design)** - Animated components
- **[Aceternity UI](https://ui.aceternity.com)** - Modern UI library

## How to Use

1. Copy the component code from the library
2. Create a new file in this folder (e.g., `SpotlightCard.tsx`)
3. Adapt imports to match our project structure
4. Export from `index.ts`

## Example

```tsx
// external/SpotlightCard.tsx
import { motion } from 'framer-motion';

export function SpotlightCard({ children }: { children: React.ReactNode }) {
  // Component code from 21st.dev or reactbits.dev
  return <motion.div>{children}</motion.div>;
}
```

## Compatibility Notes

Our project uses:
- **Framer Motion** for animations (same as most external libraries)
- **Tailwind CSS** for styling
- **React 19** with TypeScript

Most components from 21st.dev and reactbits.dev are directly compatible.

## Folder Structure

```
external/
├── README.md           # This file
├── index.ts            # Barrel exports
├── buttons/            # Button components
├── cards/              # Card components
├── backgrounds/        # Background effects
├── text/               # Text animations
└── layout/             # Layout components
```
