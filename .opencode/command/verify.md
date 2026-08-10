---
description: Run the full verification suite (lint, typecheck, security tests).
agent: build
---

Before considering the work done, run the full verification suite and fix
anything that fails:

1. `pnpm lint`
2. `npx tsc --noEmit`
3. `pnpm test:security`

Report each command's result. Do not claim the work is complete until all three
pass. Optionally run `pnpm build` to confirm a production build succeeds.
