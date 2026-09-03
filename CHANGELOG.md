# Changelog

## 2.2.9

- Maintenance-only release; no public API or runtime behavior changes.
- Updated vulnerable development dependencies and upgraded `fast-uri` to 3.1.7 (#551, #553).
- Hardened npm CI with disabled dependency lifecycle scripts, runtime audits, registry signature verification, and known-malicious-version blocking (#555).
- Added clean installation, audit, and smoke checks for both example applications (#555).
- Updated both examples to `config` 5.0.1 and refreshed Express example dependencies (#549, #550, #556).
- Grouped routine patch and minor Dependabot updates on a monthly schedule with a seven-day cooldown; major and security updates remain separate (#554).
- Refreshed development tooling, including ESLint, TypeScript ESLint, Nock, Prettier, and Node.js type definitions.

## 2.2.8

- Maintenance-only release; no public API or runtime behavior changes.
- chore(deps): bump actions/setup-node from 6 to 7 (#528) (2026-08-04)
- chore(deps-dev): bump tap from 21.7.2 to 21.7.5 (#529) (2026-08-04)
- chore(deps-dev): bump eslint from 10.7.0 to 10.8.0 (#531) (2026-08-04)
- chore(deps-dev): bump @types/node from 25.9.5 to 26.1.2 (#532) (2026-08-04)
- chore(deps-dev): bump fast-uri from 3.1.2 to 3.1.4 (#527) (2026-08-01)
- chore(deps-dev): bump fast-uri from 3.1.4 to 3.1.5 (#534) (2026-08-04)
- chore(deps-dev): bump body-parser to 2.3.0 (#537) (2026-08-04)

## 2.2.7

- chore(deps-dev): bump qs from 6.15.0 to 6.15.2 (#502) (2026-05-24)
- chore(ci): make prettier check deterministic (#519) (2026-07-20)
- chore(deps-dev): bump ws from 8.20.0 to 8.21.1 (#520) (2026-07-20)
- chore(deps-dev): bump sigstore from 4.1.0 to 4.1.1 (#518) (2026-07-20)
- chore(deps-dev): bump undici from 6.25.0 to 6.27.0 (#510) (2026-07-20)
- chore(deps-dev): bump tar from 7.5.15 to 7.5.20 (#509) (2026-07-20)
- chore(deps): bump morgan in /examples/express-sample (#516) (2026-07-20)
- chore(deps): bump body-parser in /examples/express-sample (#513) (2026-07-20)
- chore(deps): bump config from 4.4.1 to 4.4.2 in /examples/express-sample (#515) (2026-07-20)
- chore(deps): update Express example to 4.22.2 (#521) (2026-07-20)
- chore(deps): bump actions/checkout from 6 to 7 (#512) (2026-07-20)
- chore(deps): bump config from 4.4.1 to 4.4.2 in /examples/using-domains (#514) (2026-07-20)
- chore(deps): bump ejs from 5.0.2 to 6.0.1 in /examples/express-sample (#508) (2026-07-20)
- chore(deps-dev): refresh development tooling (#522) (2026-07-21)
- chore(ci): make lint checks non-mutating (#523) (2026-07-21)
- chore(deps): clean up security lockfiles (#524) (2026-07-21)

## 2.2.6

- chore(deps-dev): bump tar from 7.5.9 to 7.5.10 (#480) (2026-03-07)
- chore(deps-dev): bump tar from 7.5.10 to 7.5.11 (#481) (2026-03-12)
- chore(deps-dev): bump flatted from 3.3.3 to 3.4.2 (#482) (2026-03-24)
- chore(deps): bump picomatch from 4.0.3 to 4.0.4 (#483) (2026-03-26)
- chore(deps): bump marocchino/sticky-pull-request-comment from 2 to 3 (#488) (2026-04-01)
- chore(deps-dev): bump @types/node from 25.3.3 to 25.5.0 (#485) (2026-04-01)
- chore(deps): bump ejs from 4.0.1 to 5.0.1 in /examples/express-sample (#489) (2026-04-02)
- chore(deps-dev): bump @stylistic/eslint-plugin from 5.9.0 to 5.10.0 (#486) (2026-04-02)
- chore(deps-dev): bump typescript-eslint from 8.56.1 to 8.58.0 (#484) (2026-04-02)
- chore: upgrade to ESLint 10 and unify stylistic plugins (#490) (2026-04-02)
- chore(deps): address Dependabot security updates (#499) (2026-05-11)
- chore(deps-dev): update dev tooling dependencies (#500) (2026-05-11)
- chore(deps-dev): bump TypeScript from 5.9.3 to 6.0.3 (#495) (2026-05-11)

## 2.2.5

- fix: update stale example lockfiles to resolve tar vulnerability (CVE in tar <7.5.8) (#468) (2026-02-22)
- fix: update minimatch in example lock files to resolve ReDoS vulnerabilities (2026-02-28)
- chore(deps-dev): bump minimatch from 3.1.2 to 3.1.5 (#469) (2026-02-28)
- chore(deps-dev): bump @types/node from 25.1.0 to 25.3.3 (#471) (2026-03-02)
- chore(deps-dev): bump semver from 7.7.3 to 7.7.4 (#472) (2026-03-02)
- chore(deps-dev): bump eslint-plugin-tsdoc from 0.5.0 to 0.5.2 (#474) (2026-03-02)
- chore(deps): bump config from 4.2.0 to 4.4.1 in /examples/express-sample (#476) (2026-03-02)
- chore(deps): bump config from 4.2.0 to 4.4.1 in /examples/using-domains (#477) (2026-03-02)
- chore: regenerate lockfiles to resolve transitive vulnerabilities (#478) (2026-03-02)

## 2.2.4

- chore(deps-dev): bump tar from 7.5.7 to 7.5.9 (#466) (2026-02-20)
- chore(deps-dev): bump qs from 6.14.1 to 6.14.2 (#465) (2026-02-16)

## 2.2.3

- chore(deps): bump ejs from 3.1.10 to 4.0.1 in /examples/express-sample (#462)
- chore(deps): bump config from 4.1.1 to 4.2.0 in /examples/using-domains (#463)
- chore(deps-dev): bump prettier from 3.7.4 to 3.8.1 (#460)
- chore(deps-dev): bump @types/node from 24.10.1 to 25.1.0 (#459)
- chore(deps-dev): bump nock from 14.0.7 to 14.0.10 (#458)
- chore(deps-dev): bump typescript-eslint from 8.51.0 to 8.54.0 (#457)
- chore(deps-dev): bump @stylistic/eslint-plugin from 5.6.1 to 5.7.1 (#461)

## 2.2.2

- chore: add test:cjs to CI run (#454) (2026-01-30)
- chore(deps-dev): bump tar from 7.5.6 to 7.5.7 (#455) (2026-01-30)

## 2.2.1

- fix: replace uuid with crypto.randomUUID() for CommonJS compatibility (#452) (2026-01-27)

## 2.2.0

- chore: fix for glob dev vulnerability (#449) (2026-01-24)
- fix: broken express-sample and dependency updates in domains sample (#448) (2026-01-24)
- chore: adding AGENTS.md for better working with AI (#447) (2026-01-23)
- chore(deps-dev): bump tar from 7.5.3 to 7.5.6 (#445) (2026-01-22)
- chore(deps-dev): bump lodash from 4.17.21 to 4.17.23 (#446) (2026-01-22)
- chore(deps-dev): bump tar from 7.5.2 to 7.5.3 (#444) (2026-01-19)
- chore(deps-dev): bump eslint-plugin-tsdoc from 0.4.0 to 0.5.0 (#439) (2026-01-07)
- chore(deps-dev): bump eslint from 9.39.1 to 9.39.2 (#440) (2026-01-07)
- chore(deps-dev): bump prettier from 3.7.3 to 3.7.4 (#441) (2026-01-07)
- chore(deps-dev): bump typescript-eslint from 8.45.0 to 8.51.0 (#442) (2026-01-07)
- chore(deps-dev): bump qs from 6.14.0 to 6.14.1 (#443) (2026-01-07)
- chore(deps-dev): bump @stylistic/eslint-plugin from 5.4.0 to 5.6.1 (#432) (2025-12-09)
- chore(deps-dev): bump @types/node from 24.9.2 to 24.10.1 (#431) (2025-12-09)
- chore(deps-dev): bump prettier from 3.6.2 to 3.7.3 (#430) (2025-12-09)
- chore(deps-dev): bump eslint from 9.39.0 to 9.39.1 (#429) (2025-12-09)
- chore(deps): bump body-parser in /examples/express-sample (#434) (2025-12-09)
- chore(deps-dev): bump js-yaml from 4.1.0 to 4.1.1 (#437) (2025-12-09)
- chore(deps): bump actions/checkout from 5 to 6 (#435) (2025-12-02)
- chore(deps-dev): bump express from 5.1.0 to 5.2.0 (#436) (2025-12-02)
- chore(deps): bump actions/setup-node from 5 to 6 (#428) (2025-11-01)
- chore(deps-dev): bump @types/node from 24.6.1 to 24.9.2 (#427) (2025-11-01)
- chore(deps-dev): bump eslint from 9.34.0 to 9.39.0 (#425) (2025-11-01)
- chore(deps-dev): bump tap from 21.1.0 to 21.1.1 (#426) (2025-11-01)
- chore(deps-dev): bump semver from 7.7.2 to 7.7.3 (#424) (2025-11-01)
- chore(deps): bump @types/express from 5.0.3 to 5.0.5 (#423) (2025-11-01)
- chore(deps): bump uuid from 11.1.0 to 13.0.0 (#417) (2025-10-01)
- chore(deps-dev): bump typescript from 5.9.2 to 5.9.3 (#418) (2025-10-01)
- chore(deps): bump actions/setup-node from 4 to 5 (#422) (2025-10-01)
- chore(deps-dev): bump @types/node from 24.3.0 to 24.6.1 (#421) (2025-10-01)
- chore(deps-dev): bump typescript-eslint from 8.41.0 to 8.45.0 (#420) (2025-10-01)
- chore(deps-dev): bump @stylistic/eslint-plugin from 5.2.3 to 5.4.0 (#419) (2025-10-01)
- chore(deps): bump config from 4.1.0 to 4.1.1 in /examples/using-domains (#413) (2025-09-02)
- chore(deps-dev): bump @stylistic/eslint-plugin from 5.2.2 to 5.2.3 (#412) (2025-09-02)
- chore(deps): bump config from 4.1.0 to 4.1.1 in /examples/express-sample (#414) (2025-09-02)
- chore(deps): bump amannn/action-semantic-pull-request from 5 to 6 (#415) (2025-09-02)
- chore(deps-dev): bump eslint from 9.30.0 to 9.34.0 (#410) (2025-09-02)
- chore(deps-dev): bump typescript-eslint from 8.39.0 to 8.41.0 (#411) (2025-09-02)
- chore(deps-dev): bump @types/node from 24.0.8 to 24.3.0 (#409) (2025-09-02)
- chore(deps-dev): bump @eslint/js from 9.32.0 to 9.34.0 (#408) (2025-09-02)
- chore(deps): bump actions/checkout from 4 to 5 (#416) (2025-09-02)
- chore(deps-dev): bump typescript from 5.8.3 to 5.9.2 (#404) (2025-08-05)
- chore(deps-dev): bump @eslint/js from 9.30.0 to 9.32.0 (#403) (2025-08-01)
- chore(deps-dev): bump @stylistic/eslint-plugin from 5.1.0 to 5.2.2 (#401) (2025-08-01)
- chore(deps-dev): bump nock from 14.0.5 to 14.0.7 (#402) (2025-08-01)
- chore(deps-dev): bump typescript-eslint from 8.35.1 to 8.38.0 (#405) (2025-08-01)
- chore(deps): bump config from 4.0.0 to 4.1.0 in /examples/express-sample (#406) (2025-08-01)
- chore(deps): bump config from 4.0.0 to 4.1.0 in /examples/using-domains (#407) (2025-08-01)
- chore(deps): bump on-headers and morgan in /examples/express-sample (#400) (2025-07-22)
- chore(deps-dev): bump typescript-eslint from 8.33.0 to 8.35.1 (#399) (2025-07-01)
- chore(deps-dev): bump @types/node from 22.15.29 to 24.0.8 (#398) (2025-07-01)
- chore(deps-dev): bump semver from 7.7.1 to 7.7.2 (#397) (2025-07-01)
- chore(deps): bump @types/express from 5.0.1 to 5.0.3 (#396) (2025-07-01)
- chore(deps-dev): bump prettier from 3.5.3 to 3.6.2 (#395) (2025-07-01)
- chore(deps-dev): bump eslint from 9.25.1 to 9.30.0 (#393) (2025-07-01)
- chore(deps): bump creyD/prettier_action from 4.5 to 4.6 (#394) (2025-07-01)
- chore(deps-dev): bump @eslint/js from 9.25.1 to 9.30.0 (#392) (2025-07-01)
- chore(deps-dev): bump @stylistic/eslint-plugin from 4.4.0 to 5.1.0 (#391) (2025-07-01)
- chore(deps-dev): bump nock from 14.0.0 to 14.0.5 (#390) (2025-07-01)
- chore(deps): bump serve-favicon in /examples/express-sample (#389) (2025-07-01)
- chore(deps-dev): bump @stylistic/eslint-plugin-ts from 4.4.0 to 4.4.1 (#388) (2025-07-01)
- chore(deps): bump config from 3.3.12 to 4.0.0 in /examples/using-domains (#387) (2025-06-02)
- chore(deps): bump config in /examples/express-sample (#381) (2025-06-02)
- chore(deps-dev): bump @stylistic/eslint-plugin from 2.11.0 to 4.4.0 (#384) (2025-06-02)
- chore(deps): bump debug from 4.4.0 to 4.4.1 (#382) (2025-06-02)
- chore(deps-dev): bump typescript-eslint from 8.31.1 to 8.33.0 (#383) (2025-06-02)
- chore(deps-dev): bump @stylistic/eslint-plugin-ts from 4.2.0 to 4.4.0 (#385) (2025-06-02)
- chore(deps-dev): bump @types/node from 22.13.0 to 22.15.29 (#386) (2025-06-02)
- chore(deps): bump creyD/prettier_action from 4.3 to 4.5 (#380) (2025-06-02)
- chore(deps-dev): bump typescript-eslint from 8.29.0 to 8.31.1 (#377) (2025-05-01)
- chore(deps-dev): bump typescript from 5.8.2 to 5.8.3 (#379) (2025-05-01)
- chore(deps-dev): bump @stylistic/eslint-plugin-ts from 4.1.0 to 4.2.0 (#375) (2025-05-01)
- chore(deps-dev): bump eslint from 9.23.0 to 9.25.1 (#376) (2025-05-01)
 
## 2.1.2

- fix(sdk): Add host to headers if specified (#373) (2025-04-08)
- docs: add Releasing and Contributing (#365) (2025-03-21)
- chore(deps-dev): bump typescript from 5.7.3 to 5.8.2 (#371) (2025-04-04)
- chore(deps-dev): bump prettier from 3.4.2 to 3.5.3 (#370) (2025-04-01)
- chore(deps): bump express and @types/express (#369) (2025-04-01)
- chore(deps-dev): bump @eslint/js from 9.17.0 to 9.23.0 (#368) (2025-04-01)
- chore(deps-dev): bump eslint from 9.17.0 to 9.23.0 (#367) (2025-04-01)
- chore(deps): bump body-parser in /examples/express-sample (#366) (2025-04-01)
- chore(deps-dev): bump prismjs from 1.29.0 to 1.30.0 (#364) (2025-03-11)
- chore(deps-dev): bump @stylistic/eslint-plugin-ts from 2.11.0 to 4.1.0 (#362) (2025-03-03)
- chore(deps-dev): bump typescript-eslint from 8.19.0 to 8.25.0 (#360) (2025-03-01)
- chore(deps): bump uuid from 11.0.2 to 11.1.0 (#359) (2025-03-01)
- chore(deps-dev): bump tap from 21.0.1 to 21.1.0 (#361) (2025-03-01)
- chore(deps-dev): bump semver from 7.6.3 to 7.7.1 (#363) (2025-03-01)
- chore(deps-dev): bump nock from 13.5.6 to 14.0.0 (#358) (2025-02-07)
- chore(deps-dev): bump @types/node from 22.0.2 to 22.13.0 (#357) (2025-02-02)
- chore(deps-dev): bump eslint-plugin-tsdoc from 0.3.0 to 0.4.0 (#355) (2025-02-02)
- chore(deps-dev): bump typescript from 5.7.2 to 5.7.3 (#356) (2025-02-02)
- chore(deps-dev): bump prettier from 3.4.1 to 3.4.2 (#354) (2025-02-02)

## 2.1.1

- docs: Some documentation improvements around online/offline behaviour. (#333) (2024-10-23)
- chore(deps): bump cross-spawn from 7.0.3 to 7.0.6 in /examples/express-sample (#345) (2024-12-02)
- chore(deps): bump debug from 4.3.7 to 4.4.0 (#346) (2025-01-06)
- chore(deps): bump uuid from 10.0.0 to 11.0.2 (#338) (2024-11-01)
- chore(deps): bump @types/express from 4.17.21 to 5.0.0 (#335) (2024-11-01)
- chore(deps-dev): bump typescript from 5.6.3 to 5.7.2 (#349) (2025-01-06)
- chore(deps-dev): bump typescript-eslint from 8.17.0 to 8.19.0 (#348) (2025-01-06)
- chore(deps-dev): bump eslint from 9.16.0 to 9.17.0 (#350) (2025-01-06)
- chore(deps-dev): bump eslint from 9.11.1 to 9.16.0 (#340) (2024-12-03)
- chore(deps-dev): bump nock from 13.5.5 to 13.5.6 (#341) (2024-12-02)
- chore(deps-dev): bump prettier from 3.3.3 to 3.4.1 (#342) (2024-12-02)
- chore(deps-dev): bump @eslint/js from 9.13.0 to 9.16.0 (#343) (2024-12-02)
- chore(deps-dev): bump @stylistic/eslint-plugin from 2.8.0 to 2.11.0 (#344) (2024-12-02)
- chore(deps-dev): bump typescript-eslint from 8.3.0 to 8.12.2 (#339) (2024-11-01)
- chore(deps-dev): bump @eslint/js from 9.11.1 to 9.13.0 (#337) (2024-11-01)
- chore(deps-dev): bump typescript from 5.5.4 to 5.6.3 (#336) (2024-11-01)
- chore: Updated package.json to deal with vuln in express dependency (#352) (2025-01-14)

## 2.1.0

- chore(deps): bump cookie and express (#329) (2024-10-10)
- chore(deps): bump cookie, cookie-parser and express in /examples/express-sample (#328) (2024-10-10)

## 2.1.0-alpha

- feat: Add configurable timeouts  (#320) (2024-10-03)
- feat: Support Node v22 (#317) (2024-09-25)
- ci: Set dependabot interval to "monthly" (#295) (2024-07-23)
- chore(deps-dev): bump @stylistic/eslint-plugin-ts from 2.7.2 to 2.8.0 (#323) (2024-10-01)
- chore(deps-dev): bump @stylistic/eslint-plugin from 2.7.2 to 2.8.0 (#325) (2024-10-01)
- chore(deps): bump debug from 4.3.5 to 4.3.7 (#324) (2024-10-01)
- chore(deps-dev): bump eslint from 8.57.0 to 9.11.1 (#326) (2024-10-01)
- chore(deps): bump serve-static and express (#315) (2024-09-23)
- chore(deps): bump body-parser and express in /examples/express-sample (#314) (2024-09-23)
- chore(deps-dev): bump typescript-eslint from 7.17.0 to 8.3.0 (#310) (2024-09-02)
- chore(deps-dev): bump tap from 21.0.0 to 21.0.1 (#309) (2024-09-02)
- chore(deps-dev): bump @stylistic/eslint-plugin-ts from 2.6.0 to 2.7.2 (#308) (2024-09-02)
- chore(deps-dev): bump nock from 13.5.4 to 13.5.5 (#307) (2024-09-02)
- chore(deps-dev): bump @stylistic/eslint-plugin from 2.6.0 to 2.7.2 (#306) (2024-09-02)
- chore(deps-dev): bump @types/node from 20.14.11 to 22.0.2 (#303) (2024-08-01)
- chore(deps-dev): bump @stylistic/eslint-plugin from 2.3.0 to 2.6.0 (#302) (2024-08-01)
- chore(deps-dev): bump @eslint/js from 9.7.0 to 9.8.0 (#301) (2024-08-01)
- chore(deps-dev): bump typescript-eslint from 7.16.1 to 7.17.0 (#300) (2024-07-23)
- chore(deps-dev): bump typescript from 5.5.3 to 5.5.4 (#299) (2024-07-23)
- chore(deps-dev): bump semver from 7.6.2 to 7.6.3 (#298) (2024-07-22)
- chore(deps-dev): bump @types/node from 20.14.10 to 20.14.11 (#296) (2024-07-22)
- chore(deps-dev): bump typescript-eslint from 7.16.0 to 7.16.1 (#297) (2024-07-22)
- chore(deps-dev): bump tap from 20.0.3 to 21.0.0 (#294) (2024-07-17)
- chore(deps-dev): bump typescript-eslint from 7.15.0 to 7.16.0 (#293) (2024-07-17)
- chore(deps-dev): bump prettier from 3.3.2 to 3.3.3 (#292) (2024-07-17)
- chore(deps-dev): bump @eslint/js from 9.6.0 to 9.7.0 (#291) (2024-07-17)

## 2.0.0

- refactor!: #262 remove deprecated methods (#288)
- fix: #273 enable isAnonymous parameter (#284)
- docs: #161 Document methods using tsdoc format (#274)
- chore(deps): bump config in /examples/express-sample (#276)
- chore(deps): bump config in /examples/using-domains (#282)
- chore(deps-dev): bump @eslint/js from 9.4.0 to 9.6.0 (#279)
- chore(deps-dev): bump @stylistic/eslint-plugin from 2.2.2 to 2.3.0 (#286)
- chore(deps-dev): bump @stylistic/eslint-plugin-ts from 2.2.2 to 2.3.0 (#280)
- chore(deps-dev): bump @types/node from 20.14.8 to 20.14.9 (#278)
- chore(deps-dev): bump @types/node from 20.14.9 to 20.14.10 (#285)
- chore(deps-dev): bump tap from 19.2.5 to 20.0.3 (#277)
- chore(deps-dev): bump typescript from 5.5.2 to 5.5.3 (#287)
- chore(deps-dev): bump typescript-eslint from 7.13.1 to 7.15.0 (#283)

**BREAKING CHANGE**

- Removed deprecated methods `setUser()` and `sendWithCallback()`

## 1.2.0

- feat: #218 Optional `userInfo` in `send()`
- feat: #65 Custom timestamp parameter (#254)
- fix: #68 Better humanize string functionality (#255)
- doc: #196 add documentation on handling errors in sync transport (#259)
- refactor: #199 batch callbacks (#261)
- chore: #224 add clarification on sourcemaps and breadcrumbs (#270)
- chore(deps-dev): bump @types/node from 20.14.2 to 20.14.8 (#268)
- chore(deps-dev): bump @types/uuid from 9.0.8 to 10.0.0 (#267)
- chore(deps-dev): bump @stylistic/eslint-plugin from 2.1.0 to 2.2.2 (#265)
- chore(deps-dev): bump typescript-eslint from 7.13.0 to 7.13.1 (#264)
- chore(deps-dev): bump typescript-eslint from 7.11.0 to 7.13.0 (#258)
- chore(deps-dev): bump prettier from 3.3.0 to 3.3.2 (#257)
- chore(deps-dev): bump tap from 19.0.2 to 19.2.5 (#256)
- chore(deps): bump uuid from 9.0.1 to 10.0.0 (#250)
- chore(deps-dev): bump @types/node from 20.14.0 to 20.14.2 (#247)

## 1.1.0

- feat: Part of #220 add internal runWithBreadcrumbsAsync function (#245) (2024-06-05)
- fix: onBeforeSend allows to skip messages (#231) (2024-05-28)
- chore(deps-dev): bump @eslint/js from 9.3.0 to 9.4.0 (#243) (2024-06-03)
- chore(deps-dev): bump @types/node from 20.12.12 to 20.14.0 (#242) (2024-06-03)
- chore(deps-dev): bump prettier from 3.2.5 to 3.3.0 (#241) (2024-06-03)
- chore(deps): bump debug from 4.3.4 to 4.3.5 (#240) (2024-06-03)
- chore(deps-dev): bump typescript-eslint from 7.10.0 to 7.11.0 (#239) (2024-06-03)
- chore(deps-dev): bump tap from 18.8.0 to 19.0.2 (#237) (2024-05-28)
- chore(deps-dev): bump typescript-eslint from 7.9.0 to 7.10.0 (2024-05-27)

## 1.0.0

- feat: #219 Better Send parameters (#221) (2024-05-17)
- feat: Breadcrumbs (#210) (2024-05-15)
- fix: #138 New APM Bridge Setup (#222) (2024-05-20)
- docs: Update status badge in README.md (#209) (2024-05-10)
- refactor: #205 Setup eslint style (#207) (2024-05-09)
- refactor: #197 Refactor to use Promises internally (#200) (2024-05-09)
- refactor: #184 Cleanup debug/log messages and styles (#194) (2024-05-08)
- chore(deps-dev): bump typescript-eslint from 7.8.0 to 7.9.0 (#229) (2024-05-20)
- chore(deps-dev): bump @eslint/js from 9.2.0 to 9.3.0 (#228) (2024-05-20)
- chore(deps-dev): bump @types/node from 20.12.11 to 20.12.12 (#227) (2024-05-20)
- chore(deps-dev): bump @stylistic/eslint-plugin from 2.0.0 to 2.1.0 (#214) (2024-05-13)
- chore(deps-dev): bump tap from 18.7.2 to 18.8.0 (#213) (2024-05-13)
- chore(deps-dev): bump @types/node from 20.12.8 to 20.12.11 (#212) (2024-05-13)
- chore(deps-dev): bump semver from 7.6.0 to 7.6.2 (#211) (2024-05-13)
- chore: code cleanup (#225) (2024-05-20)
- chore: apply prettier to all files in examples (#226) (2024-05-19)

**BREAKING CHANGES**

- `send()` method signature changed.
- APM Bridge setup process changed.

See README.md for more information.

## 0.15.0-0

- async/await `send()` support
- Upgrade dependencies
- Improvements in filter method
- Improvements in documentation

## 0.14.0

- Upgrade dependencies
- Support for Node v20

## 0.13.2

- Fix batch transport keeping process alive
- Fix batch transport stalling on huge errors
- Improve batch transport performance with high error rates

## 0.13.1

- Fix format of exceptions when calling `raygunClient.send` with a string value

## 0.13.0

- Fatal errors can now be reported to Raygun by enabling the  `reportUncaughtExceptions` when initializing the client

## 0.12.4

- Expose Raygun Client types for use in TypeScript projects

## 0.12.3

- Fix regression where user function would not always be called

## 0.12.2

- Fix regression where express middleware would not pass error to next middleware

## 0.12.1

- Include @types/express as dependency

## 0.12.0

- Add integration with raygun-apm, errors reported during a trace should link between trace and error

## 0.11.1

- Fix send annotations requiring too many arguments
- Add default export to module

## 0.11.0

- Overhaul project to TypeScript, type definitions included in package
- Unhandled exceptions are now correctly tagged
- Add support for batch error reporting
- Add debug logging
- Fix Node buffer deprecation warning

## 0.10.2

- Move nock to devDependencies due to CVE
- Fix Travis Node v4 build
- Add jshint to Travis build

## 0.10.1

- Bump nock dependency to v9 as v8 has a dependency on a version of lodash with a security issue

## 0.10.0

- Add support for inner errors. Option `innerErrorFieldName` to specify a field or a function on the error object to use for retrieval of an inner error. Defaults to `cause` which is used in [VError](https://github.com/joyent/node-verror)

## 0.9.1

- Add an option to report column number for each frame of the stack trace

## 0.9.0

- Add capability to send custom data with Express handler
- Treat custom errors as Errors
- `useSSL` option now works correctly, and support added for HTTP proxies
- If network errors occur during payload posting, and a Node-style error callback param is available on the callback, this is now executed
- Functional sending tests now pass correctly

## 0.8.5

- Add ability to turn off 'humanised-object-strings'

## 0.8.4

- Add some smarts around passing an object in to the exception parameter

## 0.8.3

- Turn strings into errors if passed through. Log out request errors.

## 0.8.2

- Add setTags method

## 0.8.1

- Add custom error grouping key

## 0.8.0

- Add offline support

## 0.7.1

- Default useSSL to true

## 0.7.0

- Add onBeforeSend hook, api endpoint options, and bug fixes

## 0.6.2

- Fix utf8 chars causing 400s, log when errors occur when posting

## 0.6.1

- Replace deprecated request.host with request.hostname if it exists

## 0.6.0

- Added ability to send tags with exception reports

## 0.5.0

- Added filters for sensitive request data, and better affected user tracking/Customers

## 0.4.2

- Minor test refactor

## 0.4.1

- Fixed issue where getting cpu information returned undefined

## 0.4.0

- Added *user* function, deprecated setUser

## 0.3.0

- Added version and user tracking/Customers functionality; bump jshint version, update test

## 0.2.0

- Added Express handler, bug fixes

## 0.1.2

- Include more error information

## 0.1.1

- Point at the correct API endpoint, include correct dependencies for NPM

## 0.1.0

- Initial release
