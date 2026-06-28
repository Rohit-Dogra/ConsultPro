/* Client-side AES-256-GCM helpers and encrypted fetch wrapper
   - Supports `encrypt` (encrypt request body + request encrypted response)
   - Supports `responseEncrypt` (request encrypted response only for GETs)
*/

function base64ToUint8Array(b64: string) {
  const bin = atob(b64);
  const len = bin.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function uint8ArrayToBase64(u8: Uint8Array) {
  let s = '';
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s);
}

async function importKey() {
  const b64 = (import.meta.env.VITE_AES_KEY as string) || '';
  if (!b64) throw new Error('VITE_AES_KEY not set');
  const raw = base64ToUint8Array(b64);
  return await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptObject(obj: any) {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(obj));
  const ctBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const ctArray = new Uint8Array(ctBuffer);
  const tagLen = 16;
  const tag = ctArray.slice(ctArray.length - tagLen);
  const data = ctArray.slice(0, ctArray.length - tagLen);
  return {
    iv: uint8ArrayToBase64(iv),
    tag: uint8ArrayToBase64(tag),
    data: uint8ArrayToBase64(data)
  };
}

export async function decryptPayload(payload: { iv: string; tag: string; data: string }) {
  const key = await importKey();
  const iv = base64ToUint8Array(payload.iv);
  const tag = base64ToUint8Array(payload.tag);
  const data = base64ToUint8Array(payload.data);
  const combined = new Uint8Array(data.length + tag.length);
  combined.set(data, 0);
  combined.set(tag, data.length);
  const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined.buffer);
  const txt = new TextDecoder().decode(plainBuffer);
  try {
    return JSON.parse(txt);
  } catch (e) {
    return txt;
  }
}

export async function encryptedFetch(input: RequestInfo, init: RequestInit & { encrypt?: boolean; responseEncrypt?: boolean } = {}) {
  const { encrypt = false, responseEncrypt = false, headers = {}, body, ...rest } = init as any;

  let finalBody: any = body;
  const finalHeaders: Record<string, string> = Object.assign({}, headers as Record<string, string>);

  if (encrypt && body != null) {
    const payload = typeof body === 'string' ? JSON.parse(body) : body;
    const enc = await encryptObject(payload);
    finalBody = JSON.stringify(enc);
    finalHeaders['Content-Type'] = 'application/json';
    finalHeaders['x-encrypted'] = 'aes';
    finalHeaders['x-response-encrypt'] = 'aes';
  } else if (responseEncrypt) {
    finalHeaders['x-response-encrypt'] = 'aes';
  }

  const response = await fetch(input, Object.assign({}, rest, { method: init.method, headers: finalHeaders, body: finalBody }));

  if (response.headers.get('x-encrypted') === 'aes') {
    const enc = await response.json();
    const decrypted = await decryptPayload(enc);
    return { ok: response.ok, status: response.status, data: decrypted };
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = await response.json();
    return { ok: response.ok, status: response.status, data: json };
  }
  const text = await response.text();
  return { ok: response.ok, status: response.status, data: text };
}

export default encryptedFetch;
