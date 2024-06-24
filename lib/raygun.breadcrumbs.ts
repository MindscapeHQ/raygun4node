import type { AsyncLocalStorage } from "async_hooks";
import type { BreadcrumbMessage, Breadcrumb } from "./types";
import { format } from "node:util";
import ansiRegex from "ansi-regex";

const regex = ansiRegex();
const debug = require("debug")("raygun");

let asyncLocalStorage: AsyncLocalStorage<Breadcrumb[]> | null = null;

try {
  asyncLocalStorage = new (require("async_hooks").AsyncLocalStorage)();
  debug("[raygun.breadcrumbs.ts] initialized successfully");
} catch (e) {
  debug(
    "[raygun.breadcrumbs.ts] failed to load async_hooks.AsyncLocalStorage - initialization failed\n",
    e,
  );
}

type SourceFile = {
  fileName: string;
  functionName: string;
  lineNumber: number | null;
};

function returnCallerSite(
  err: Error,
  callsites: NodeJS.CallSite[],
): SourceFile | null {
  for (const callsite of callsites) {
    const fileName = callsite.getFileName() || "";

    if (fileName.startsWith(__dirname)) {
      continue;
    }

    return {
      fileName: fileName,
      functionName: callsite.getFunctionName() || "<anonymous>",
      lineNumber: callsite.getLineNumber(),
    };
  }

  return null;
}

function getCallsite(): SourceFile | null {
  const originalPrepareStacktrace = Error.prepareStackTrace;

  Error.prepareStackTrace = returnCallerSite;

  // Ignore use of any, required for captureStackTrace
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output: any = {};

  Error.captureStackTrace(output);

  const callsite = output.stack;
  Error.prepareStackTrace = originalPrepareStacktrace;
  return callsite;
}

export function addBreadcrumb(
  breadcrumb: string | BreadcrumbMessage,
  type: Breadcrumb["type"] = "manual",
) {
  const crumbs = getBreadcrumbs();

  if (!crumbs) {
    return;
  }

  if (typeof breadcrumb === "string") {
    const expandedBreadcrumb: BreadcrumbMessage = {
      message: breadcrumb,
      level: "info",
      category: "",
    };

    breadcrumb = expandedBreadcrumb;
  }

  const callsite = getCallsite();

  const internalCrumb: Breadcrumb = {
    ...(breadcrumb as BreadcrumbMessage),
    category: breadcrumb.category || "",
    message: breadcrumb.message || "",
    level: breadcrumb.level || "info",
    timestamp: Number(new Date()),
    type,
    className: callsite?.fileName,
    methodName: callsite?.functionName,

    // TODO - do we need to do any source mapping?
    lineNumber: callsite?.lineNumber || undefined,
  };

  debug(
    `[raygun.breadcrumbs.ts] recorded breadcrumb: ${internalCrumb.message}`,
  );

  crumbs.push(internalCrumb);
}

export function getBreadcrumbs(): Breadcrumb[] | null {
  if (!asyncLocalStorage) {
    return null;
  }

  const store = asyncLocalStorage.getStore();

  if (store) {
    return store;
  }

  const newStore: Breadcrumb[] = [];

  debug("[raygun.breadcrumbs.ts] enter with new store");
  asyncLocalStorage.enterWith(newStore);

  return newStore;
}

export function runWithBreadcrumbs(f: () => void, store: Breadcrumb[] = []) {
  if (!asyncLocalStorage) {
    f();
    return;
  }

  debug("[raygun.breadcrumbs.ts] running function with breadcrumbs");
  asyncLocalStorage.run(store, f);
}

export function runWithBreadcrumbsAsync<T>(
  f: () => Promise<T>,
  store: Breadcrumb[] = [],
): Promise<T> {
  if (!asyncLocalStorage) {
    return f();
  }

  debug("[raygun.breadcrumbs.ts] running async function with breadcrumbs");
  return asyncLocalStorage.run(store, f);
}

export function clear() {
  if (!asyncLocalStorage) {
    return;
  }

  debug(
    "[raygun.breadcrumbs.ts] clearing stored breadcrumbs, entering with new store",
  );
  asyncLocalStorage.enterWith([]);
}

export function setupConsoleBreadcrumbs() {
  // Map console methods to a Breadcrumb level
  const consoleMethods: [keyof typeof console, Breadcrumb["level"]][] = [
    ["debug", "debug"],
    ["log", "info"],
    ["info", "info"],
    ["warn", "warning"],
    ["error", "error"],
  ];

  // Extend all console methods to call to addBreadcrumb
  for (const [method, level] of consoleMethods) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldMethod = (console as any)[method];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (console as any)[method] = function logWithBreadcrumb<T>(
      this: T,
      // Ensure we preserve all original arguments
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) {
      // Call to node-util format like the original console methods
      // and remove any ansi encoding (e.g. console colors) using replace
      addBreadcrumb(
        { message: format(...args).replace(regex, ""), level },
        "console",
      );
      // Still call original method
      return oldMethod.apply(this, args);
    };
  }
}
