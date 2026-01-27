# AGENTS.md

## Project Overview

**raygun4node** is the official Raygun.com Node.js SDK, written in TypeScript. It enables Node.js applications to send crash reports and error data to the Raygun error monitoring service.

### Key Features

- Error reporting to Raygun API
- Express.js middleware integration
- Breadcrumbs for debugging context
- Batched error transport for high-volume apps
- Offline caching with disk or custom storage providers
- Source map support for stack traces
- Custom error grouping and tagging
- User tracking for affected customer counts

## Repository Structure

```
lib/           # TypeScript source files
  raygun.ts              # Main Client class
  raygun.transport.ts    # HTTP transport for sending errors
  raygun.batch.ts        # Batched transport mode
  raygun.offline.ts      # Offline caching provider
  raygun.breadcrumbs.ts  # Breadcrumb tracking
  raygun.messageBuilder.ts # Error payload builder
  types.ts               # TypeScript type definitions
build/         # Compiled JavaScript output
test/          # Test files (tap test framework)
examples/      # Usage examples
```

## Commands

### Build

```bash
npm run prepare    # Compiles TypeScript to build/
```

### Test

```bash
npm test           # Runs tests using tap with ts-node
```

### Lint

```bash
npm run eslint     # Lint JS files (test/*.js, examples/)
npm run tseslint   # Lint TS files (lib/*.ts)
npm run prettier   # Format all source files
```

## Tech Stack

- **Language**: TypeScript (compiled to ES5 CommonJS)
- **Runtime**: Node.js (>= 0.10.0)
- **Test Framework**: tap
- **Linting**: ESLint + TypeScript ESLint
- **Formatting**: Prettier

## Key Dependencies

- `stack-trace`: Stack trace parsing
- `debug`: Debug logging (enabled via `DEBUG=raygun`)

## Examples

Two example applications are provided in `examples/`:

### Express Sample (`examples/express-sample/`)

Demonstrates Express.js integration with Raygun middleware and breadcrumbs.

```bash
# From project root, build the package first
npm install

# Configure API key in examples/express-sample/config/default.json
# Then run the example
cd examples/express-sample
npm install && npm start
```

Key files:
- `raygun.client.js` - Raygun client setup
- `app.js` - Express middleware configuration
- `routes/index.js` - `/send` and `/error` endpoints

### Using Domains (`examples/using-domains/`)

Shows how to use Raygun with Node.js domains (legacy, prefer `reportUncaughtExceptions` for Node 12+).

```bash
# From project root, build the package first
npm install

# Configure API key in examples/using-domains/config/default.json
# Then run the example
cd examples/using-domains
npm install && node app
```

## Code Conventions

- Source files are in `lib/` as `.ts` files
- Tests are in `test/` as `.js` files
- Entry point: `build/raygun.js` with types at `build/raygun.d.ts`
- Use strict TypeScript (`"strict": true`)
