import { Injectable } from '@nestjs/common';

@Injectable()
export class DocumentService {
  private document = {
    content: '',
    revision: 0,
  };

  getDocument() {
    return this.document;
  }

  // applyOperation(op: OTOperation) {
  //   this.document.content = apply(this.document.content, op);
  // }

  incrementRevision(): number {
    this.document.revision += 1;
    return this.document.revision;
  }
}
