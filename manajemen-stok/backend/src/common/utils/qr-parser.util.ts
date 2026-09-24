/**
 * Utility Parser untuk Plain Text QR Code MTM WHFG
 * Mendukung format:
 * 1. Key-Value: PART:45107-BZ010|PT:PT. TOYOTA MOTOR|QTY:50|LOT:LOT-001
 * 2. Delimited: 45107-BZ010|PT. TOYOTA MOTOR|50|Line1|20260924|001
 * 3. Simple: 45107-BZ010
 */

export interface ParsedQrData {
  raw: string;
  partNumber: string;
  customerPartNumber: string;
  customerName?: string;
  qty: number;
  lineOrJob: string;
  date: string;
  sequenceNumber: string;
  uniqueTag: string;
}

export function parseQrData(rawQr: string): ParsedQrData {
  if (!rawQr || typeof rawQr !== 'string') {
    throw new Error('Data QR Code kosong atau tidak valid');
  }

  const trimmed = rawQr.trim();
  const tokens = trimmed.split('|');

  let partNumber = '';
  let customerPartNumber = '';
  let customerName = '';
  let qty = 0;
  let lineOrJob = '';
  let date = '';
  let sequenceNumber = '';
  let uniqueTag = '';

  let isKeyValue = false;

  for (const token of tokens) {
    const t = token.trim();
    if (t.toUpperCase().startsWith('PART:')) {
      partNumber = t.substring(5).trim();
      isKeyValue = true;
    } else if (t.toUpperCase().startsWith('PT:') || t.toUpperCase().startsWith('CUST:')) {
      customerName = t.substring(3).trim();
      isKeyValue = true;
    } else if (t.toUpperCase().startsWith('QTY:')) {
      const q = parseInt(t.substring(4).trim(), 10);
      qty = isNaN(q) ? 0 : q;
      isKeyValue = true;
    } else if (t.toUpperCase().startsWith('LOT:')) {
      uniqueTag = t.substring(4).trim();
      isKeyValue = true;
    } else if (t.toUpperCase().startsWith('LINE:')) {
      lineOrJob = t.substring(5).trim();
      isKeyValue = true;
    }
  }

  if (!isKeyValue) {
    if (tokens.length >= 1) partNumber = tokens[0]?.trim() || '';
    if (tokens.length >= 2) customerPartNumber = tokens[1]?.trim() || '';
    if (tokens.length >= 3) {
      const parsedQty = parseInt(tokens[2]?.trim(), 10);
      qty = isNaN(parsedQty) ? 0 : parsedQty;
    }
    if (tokens.length >= 4) lineOrJob = tokens[3]?.trim() || '';
    if (tokens.length >= 5) date = tokens[4]?.trim() || '';
    if (tokens.length >= 6) sequenceNumber = tokens[5]?.trim() || '';

    if (partNumber && date && sequenceNumber) {
      uniqueTag = `${partNumber}-${date}-${sequenceNumber}`;
    } else if (partNumber && date) {
      uniqueTag = `${partNumber}-${date}-${sequenceNumber || '0000'}`;
    } else {
      uniqueTag = trimmed.replace(/\s+/g, '_');
    }
  }

  if (!uniqueTag) {
    uniqueTag = `${partNumber || 'PART'}-${Date.now()}`;
  }

  return {
    raw: trimmed,
    partNumber,
    customerPartNumber,
    customerName,
    qty,
    lineOrJob,
    date,
    sequenceNumber,
    uniqueTag,
  };
}
