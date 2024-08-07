import type { AsyncLocalStorage } from "async_hooks";
import type { BreadcrumbMessage, Breadcrumb } from "./types";
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

/**
 * Adds Breadcrumb to current scope
 * @param breadcrumb - either String message or BreadcrumbMessage object
 * @param type - defaults to manual, values as defined in Breadcrumb type
 */
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
    lineNumber: callsite?.lineNumber || undefined,
  };

  debug(
    `[raygun.breadcrumbs.ts] recorded breadcrumb: ${internalCrumb.message}`,
  );

  crumbs.push(internalCrumb);
}

/**
 * Obtain list of Breadcrumbs in current scope
 * @returns List of Breadcrumbs or null if no local storage
 */
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

/**
 * Run synchronous function in Breadcrumb scope
 * @param f - function to run
 * @param store - optional Breadcrumb scope store
 */
export function runWithBreadcrumbs(f: () => void, store: Breadcrumb[] = []) {
  if (!asyncLocalStorage) {
    f();
    return;
  }

  debug("[raygun.breadcrumbs.ts] running function with breadcrumbs");
  asyncLocalStorage.run(store, f);
}

/**
 * Run asynchronous function returning a Promise in Breadcrumb scope
 * @param f - asynchronous function to run
 * @param store - optional Breadcrumb scope store
 */
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

/**
 * Clear the stored Breadcrumbs in current scope
 */
export function clear() {
  if (!asyncLocalStorage) {
    return;
  }

  debug(
    "[raygun.breadcrumbs.ts] clearing stored breadcrumbs, entering with new store",
  );
  asyncLocalStorage.enterWith([]);
}
