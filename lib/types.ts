import type { IncomingMessage } from "http";

// IndexableError is a type that extends the Error type
// and allows for any additional properties to be added to it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IndexableError = Error & Record<string, any>;

export type MessageBuilderOptions = {
  reportColumnNumbers?: boolean;
  useHumanStringForObject?: boolean;
  innerErrorFieldName?: string;
  filters?: string[];
};

export type StackFrame = {
  lineNumber: number;
  columnNumber?: number;
  className: string;
  fileName: string;
  methodName: string;
};

export type Message = {
  occurredOn: Date;
  details: MessageDetails;
};

export type MessageBuilding = {
  occurredOn: Date;
  details: Partial<MessageDetails>;
};

export type BuiltError = {
  message: string;
  stackTrace?: StackFrame[];
  className?: string;
  innerError?: BuiltError;
};

export type MessageDetails = {
  client: {
    name: string;
    version: string;
  };
  groupingKey: string | null;
  error: BuiltError;
  version: string;
  user: UserDetails;
  request: RequestDetails;
  tags: Tag[];
  userCustomData: CustomData;
  machineName: string;
  environment: Environment;
  correlationId: string | null;
  breadcrumbs?: Breadcrumb[];
};

export type Environment = {
  osVersion: string;
  architecture: string;
  totalPhysicalMemory: number;
  availablePhysicalMemory: number;
  utcOffset: number;
  processorCount?: number;
  cpu?: string;
};

export type Tag = string;

export type SendOptions = {
  message: string;
  http: HTTPOptions;
};

export type HTTPOptions = {
  useSSL: boolean;
  host: string | undefined;
  port: number | undefined;
  apiKey: string;
};

// Allow any because users are free to set anything as CustomData
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CustomData = any;

export type RequestParams = ({ host: string } | { hostname: string }) &
  CommonRequestParams;

type CommonRequestParams = {
  path: string;
  method: string;
  ip: string;
  query: object;
  headers: object;
  body: object;
};

export type RequestDetails = {
  hostName: string;
  url: string;
  httpMethod: string;
  ipAddress: string;
  queryString: object;
  headers: object;
  form: object;
};

export type UserDetails = {
  identifier?: string;
  uuid?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
};

export type RawUserData = {
  identifier?: string;
  uuid?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
};

export type OfflineStorageOptions = {
  cachePath: string;
  cacheLimit?: number;
};

export type Transport = {
  send(options: SendOptions): Promise<IncomingMessage>;
};

export type MessageTransport = {
  send(message: string): void;
};

export type Hook<T> = (
  message: Message,
  exception: Error | string,
  customData: CustomData,
  request?: RequestParams,
  tags?: Tag[],
) => T;

export interface IOfflineStorage {
  init(options: OfflineStorageOptions | undefined): void;
  save(message: string, callback: (error: Error | null) => void): void;
  retrieve(
    callback: (error: NodeJS.ErrnoException | null, items: string[]) => void,
  ): void;
  send(callback: (error: Error | null, items?: string[]) => void): void;
}

export type RaygunOptions = {
  apiKey: string;
  filters?: string[];
  host?: string;
  port?: number;
  useSSL?: boolean;
  onBeforeSend?: Hook<Message>;
  offlineStorage?: IOfflineStorage;
  offlineStorageOptions?: OfflineStorageOptions;
  isOffline?: boolean;
  groupingKey?: Hook<string>;
  tags?: Tag[];
  useHumanStringForObject?: boolean;
  reportColumnNumbers?: boolean;
  innerErrorFieldName?: string;
  batch?: boolean;
  batchFrequency?: number;
  reportUncaughtExceptions?: boolean;
};

export type CallbackNoError<T> = (t: T | null) => void;
export type CallbackWithError<T> = (e: Error | null, t: T | null) => void;

export function isCallbackWithError<T>(
  cb: Callback<T>,
): cb is CallbackWithError<T> {
  return cb.length > 1;
}

export function callVariadicCallback<T>(
  callback: Callback<T>,
  error: Error | null,
  result: T | null,
) {
  if (isCallbackWithError(callback)) {
    return callback(error, result);
  } else {
    return callback(result);
  }
}

export type Callback<T> = CallbackNoError<T> | CallbackWithError<T>;

export type Breadcrumb = {
  timestamp: number;
  level: "debug" | "info" | "warning" | "error";
  type: "manual" | "navigation" | "click-event" | "request" | "console";
  category: string;
  message: string;
  customData?: CustomData;
  className?: string;
  methodName?: string;
  lineNumber?: number;
};

export type BreadcrumbMessage = Partial<
  Pick<Breadcrumb, "level" | "category" | "message" | "customData">
>;

export interface SendParameters {
  customData?: CustomData;
  request?: RequestParams;
  tags?: Tag[];
}
