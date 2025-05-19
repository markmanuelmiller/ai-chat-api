#!/bin/bash
cd "$(dirname "$0")"
npx ts-node -r tsconfig-paths/register src/tests/mocks/server/index.ts
