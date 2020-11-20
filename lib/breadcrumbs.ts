import type { AsyncLocalStorage } from "async_hooks";
import type { Breadcrumb, InternalBreadcrumb } from "./types";
import path from "path";
const debug = require("debug")("raygun").bind(null, "[breadcrumbs]");

let asyncLocalStorage: AsyncLocalStorage<InternalBreadcrumb[]> | null = null;

try {
  asyncLocalStorage = new (require("async_hooks").AsyncLocalStorage)();
  debug("initialized successfully");
} catch (e) {
  debug(
    "failed to load async_hooks.AsyncLocalStorage - initialization failed\n",
    e
  );
}

type SourceFile = {
  fileName: string;
  functionName: string;
  lineNumber: number | null;
};

function returnCallerSite(
  err: Error,
  callsites: NodeJS.CallSite[]
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

  const output: any = {};

  Error.captureStackTrace(output);

  const callsite = output.stack;
  Error.prepareStackTrace = originalPrepareStacktrace;
  return callsite;
}

export function addBreadcrumb(breadcrumb: string | Breadcrumb) {
  debug("adding breadcrumb:", breadcrumb);

  const crumbs = getBreadcrumbs();

  if (!crumbs) {
    return;
  }

  if (typeof breadcrumb === "string") {
    const expandedBreadcrumb: Breadcrumb = {
      message: breadcrumb,
      level: "info",
      category: "",
    };

    breadcrumb = expandedBreadcrumb;
  }

  const callsite = getCallsite();

  const internalCrumb: InternalBreadcrumb = {
    ...(breadcrumb as Breadcrumb),
    timestamp: Number(new Date()),
    type: "manual",
    className: callsite?.fileName,
    methodName: callsite?.functionName,

    // TODO - do we need to do any source mapping?
    lineNumber: callsite?.lineNumber || undefined,
  };

  debug("recorded breadcrumb:", internalCrumb);

  crumbs.push(internalCrumb);
}

export function getBreadcrumbs(): InternalBreadcrumb[] | null {
  if (!asyncLocalStorage) {
    return null;
  }

  return asyncLocalStorage.getStore() || null;
}

export function runWithBreadcrumbs(f: () => void) {
  if (!asyncLocalStorage) {
    f();
    return;
  }
  debug("running function with breadcrumbs");

  asyncLocalStorage.run([], f);
}
