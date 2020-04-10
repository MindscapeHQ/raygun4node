export interface IndexableError extends Error {
  [key: string]: any;
}

export interface MessageBuilderOptions {
  reportColumnNumbers?: boolean;
  useHumanStringForObject?: boolean;
  innerErrorFieldName: string;
  filters: string[];
}

export interface StackFrame {
  lineNumber: number;
  columnNumber?: number;
  className: string;
  fileName: string;
  methodName: string;
}

export interface Message {
  occurredOn: Date;
  details: MessageDetails;
}

export interface MessageBuilding {
  occurredOn: Date;
  details: Partial<MessageDetails>;
}

export type BuiltError = {
  message: string;
  stackTrace?: StackFrame[];
  className?: string;
  innerError?: BuiltError;
};

export interface MessageDetails {
  client: {
    name: string;
    version: string;
  };
  groupingKey: string;
  error: BuiltError;
  version: string;
  user: UserDetails;
  request: RequestDetails;
  tags: Tag[];
  userCustomData: CustomData;
  machineName: string;
  environment: Environment;
}

export type Environment = {
  osVersion: string;
  architecture: string;
  totalPhysicalMemory: number;
  availablePhysicalMemory: number;
  utcOffset: number;
  processorCount?: number;
  cpu?: string;
};

export interface Tag {}

export interface SendOptions {
  message: Message;
  useSSL: boolean;
  host: string | undefined;
  port: number | undefined;
  apiKey: string;
  callback: Function;
}

export type CustomData = any;

export type RequestParams = ({ host: string } | { hostname: string }) &
  CommonRequestParams;

interface CommonRequestParams {
  hostname?: string;
  host: string;
  path: string;
  method: string;
  ip: string;
  query: object;
  headers: object;
  body: object;
}

export interface RequestDetails {
  hostName: string;
  url: string;
  httpMethod: string;
  ipAddress: string;
  queryString: object;
  headers: object;
  form: object;
}

export interface UserDetails {
  identifier?: string;
  uuid?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
}

export interface RawUserData {
  identifier?: string;
  uuid?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
}

export type OfflineStorageOptions = {
  cachePath: string;
  cacheLimit?: number;
};
