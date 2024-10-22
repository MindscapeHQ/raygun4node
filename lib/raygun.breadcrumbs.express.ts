import type { Request } from "express";
import type { Breadcrumb } from "./types";
import { getBreadcrumbs } from "./raygun.breadcrumbs";

const debug = require("debug")("raygun");

/**
 * Parses an ExpressJS Request and adds it to the breadcrumbs store
 * @param request - ExpressJS request object
 */
export function addRequestBreadcrumb(request: Request) {
  const crumbs = getBreadcrumbs();

  if (!crumbs) {
    debug(
      "[raygun.breadcrumbs.express.ts] Add request breadcrumb skip, no store!",
    );
    return;
  }

  const internalCrumb: Breadcrumb = {
    category: "http",
    message: `${request.method} ${request.url}`,
    level: "info",
    timestamp: Number(new Date()),
    type: "request",
  };

  debug(
    `[raygun.breadcrumbs.express.ts] recorded request breadcrumb: ${JSON.stringify(internalCrumb, undefined, 2)}`,
  );

  crumbs.push(internalCrumb);
}
