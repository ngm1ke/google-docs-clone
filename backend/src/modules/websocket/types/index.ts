export interface InsertOperation {
  type: 'insert';
  position: number;
  text: string;
}

export interface DeleteOperation {
  type: 'delete';
  position: number;
  length: number;
}

export type OTOperation = InsertOperation | DeleteOperation;

export interface OperationMessage {
  version: number;
  operation: OTOperation;
}
