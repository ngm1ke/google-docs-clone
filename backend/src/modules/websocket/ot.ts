import type { OTOperation } from './types';
// The client must implement exactly the same

export function apply(text: string, op: OTOperation): string {
  if (op.type === 'insert') {
    return text.slice(0, op.position) + op.text + text.slice(op.position);
  } else {
    // delete
    return text.slice(0, op.position) + text.slice(op.position + op.length);
  }
}

export function applyAll(text: string, ops: OTOperation[]): string {
  let currentText = text;
  for (const op of ops) {
    currentText = apply(currentText, op);
  }
  return currentText;
}

export function transform(
  opA: OTOperation,
  opB: OTOperation,
  clientIdA: string,
  clientIdB: string,
): [OTOperation[], OTOperation[]] {
  if (opA.type === 'insert' && opB.type === 'insert') {
    if (opA.position > opB.position) {
      return [[{ ...opA, position: opA.position + opB.text.length }], [opB]];
    } else if (opA.position < opB.position) {
      return [[opA], [{ ...opB, position: opB.position + opA.text.length }]];
    } else {
      // Tie breaker
      if (clientIdA < clientIdB) {
        return [[opA], [{ ...opB, position: opB.position + opA.text.length }]];
      } else {
        return [[{ ...opA, position: opA.position + opB.text.length }], [opB]];
      }
    }
  }

  if (opA.type === 'insert' && opB.type === 'delete') {
    const posA = opA.position;
    const posB = opB.position;
    const lenB = opB.length;

    if (posA <= posB) {
      return [[opA], [{ ...opB, position: posB + opA.text.length }]];
    } else if (posA >= posB + lenB) {
      return [[{ ...opA, position: posA - lenB }], [opB]];
    } else {
      // posA is inside B's deleted range
      const opAPrime: OTOperation = {
        type: 'insert',
        position: posB,
        text: opA.text,
      };
      // B' is split into two deletes
      const opBPrime1: OTOperation = {
        type: 'delete',
        position: posB,
        length: posA - posB,
      };
      const opBPrime2: OTOperation = {
        type: 'delete',
        position: posB + opA.text.length,
        length: posB + lenB - posA,
      };
      const opsBPrime: OTOperation[] = [];
      if (opBPrime1.length > 0) opsBPrime.push(opBPrime1);
      if (opBPrime2.length > 0) opsBPrime.push(opBPrime2);
      return [[opAPrime], opsBPrime];
    }
  }

  if (opA.type === 'delete' && opB.type === 'insert') {
    // Symmetric to insert-delete
    const [opsBPrime, opsAPrime] = transform(opB, opA, clientIdB, clientIdA);
    return [opsAPrime, opsBPrime];
  }

  if (opA.type === 'delete' && opB.type === 'delete') {
    const posA = opA.position;
    const lenA = opA.length;
    const posB = opB.position;
    const lenB = opB.length;

    if (posA + lenA <= posB) {
      return [[opA], [{ ...opB, position: posB - lenA }]];
    } else if (posB + lenB <= posA) {
      return [[{ ...opA, position: posA - lenB }], [opB]];
    } else {
      // Overlap
      const overlapStart = Math.max(posA, posB);
      const overlapEnd = Math.min(posA + lenA, posB + lenB);
      const overlapLen = Math.max(0, overlapEnd - overlapStart);

      const newPosA = posA - Math.max(0, Math.min(posA, posB + lenB) - posB);
      const newLenA = lenA - overlapLen;

      const newPosB = posB - Math.max(0, Math.min(posB, posA + lenA) - posA);
      const newLenB = lenB - overlapLen;

      const opsAPrime: OTOperation[] = [];
      if (newLenA > 0) {
        opsAPrime.push({ type: 'delete', position: newPosA, length: newLenA });
      }

      const opsBPrime: OTOperation[] = [];
      if (newLenB > 0) {
        opsBPrime.push({ type: 'delete', position: newPosB, length: newLenB });
      }

      return [opsAPrime, opsBPrime];
    }
  }

  return [[opA], [opB]];
}

export function transformOpAgainstList(
  op: OTOperation,
  ops: OTOperation[],
  clientIdOp: string = '',
  clientIdOps: string = '',
): [OTOperation[], OTOperation[]] {
  let currentOpParts = [op];
  const resultOps: OTOperation[] = [];

  for (const otherOp of ops) {
    let currentOtherParts = [otherOp];
    const nextOpParts: OTOperation[] = [];

    for (const cOp of currentOpParts) {
      const nextOtherParts: OTOperation[] = [];
      for (const other of currentOtherParts) {
        const [tOps, tOthers] = transform(cOp, other, clientIdOp, clientIdOps);
        nextOpParts.push(...tOps);
        nextOtherParts.push(...tOthers);
      }
      currentOtherParts = nextOtherParts;
    }
    resultOps.push(...currentOtherParts);
    currentOpParts = nextOpParts;
  }

  return [currentOpParts, resultOps];
}

export function transformLists(
  opsA: OTOperation[],
  opsB: OTOperation[],
  clientIdA: string = '',
  clientIdB: string = '',
): [OTOperation[], OTOperation[]] {
  let currentOpsB = [...opsB];
  const finalA: OTOperation[] = [];

  for (const opA of opsA) {
    const [tOpAParts, tOpsB] = transformOpAgainstList(
      opA,
      currentOpsB,
      clientIdA,
      clientIdB,
    );
    finalA.push(...tOpAParts);
    currentOpsB = tOpsB;
  }

  return [finalA, currentOpsB];
}

export function adjustCursor(cursor: number, ops: OTOperation[]): number {
  let newCursor = cursor;
  for (const op of ops) {
    if (op.type === 'insert') {
      if (op.position <= newCursor) {
        newCursor += op.text.length;
      }
    } else if (op.type === 'delete') {
      if (op.position + op.length <= newCursor) {
        newCursor -= op.length;
      } else if (op.position < newCursor) {
        newCursor = op.position;
      }
    }
  }
  return newCursor;
}
