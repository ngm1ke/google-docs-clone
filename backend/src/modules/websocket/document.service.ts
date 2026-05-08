import { Injectable } from '@nestjs/common';
import type { OTOperation } from './types';
import { applyAll } from './ot';

export interface HistoryItem {
  version: number;
  operations: OTOperation[];
  clientId: string;
}

@Injectable()
export class DocumentService {
  private document = {
    content: '',
    revision: 0,
  };

  private history: HistoryItem[] = [];

  getDocument() {
    return this.document;
  }

  applyOperations(ops: OTOperation[]) {
    this.document.content = applyAll(this.document.content, ops);
  }

  incrementRevision(): number {
    this.document.revision += 1;
    return this.document.revision;
  }

  addHistory(version: number, operations: OTOperation[], clientId: string) {
    this.history.push({ version, operations, clientId });
  }

  getHistorySince(version: number): HistoryItem[] {
    return this.history.filter((h) => h.version > version);
  }
}
