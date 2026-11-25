export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.fieldErrors = body?.fieldErrors ?? null;
  }
}

export async function request(method, url, body) {
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Không kết nối được máy chủ', 0);
  }
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* proxy trả HTML khi backend tắt */
  }
  if (!res.ok || data === null && text) {
    const offline = res.status === 502 || res.status === 503 || res.status === 504 || (res.status === 500 && data === null);
    throw new ApiError(offline ? 'Không kết nối được máy chủ' : data?.message ?? `Lỗi máy chủ (${res.status})`, offline ? 0 : res.status, data);
  }
  return data && typeof data === 'object' && 'success' in data ? data.data : data;
}
