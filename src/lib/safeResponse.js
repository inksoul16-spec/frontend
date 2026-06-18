// Safe response parser: if response is JSON parse it, otherwise return text under _text
export async function safeParseResponse(res) {
  if (!res || !res.headers) return {};
  const ct = res.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) return await res.json();
    const txt = await res.text();
    return { _text: txt };
  } catch (e) {
    return { _text: 'Failed to parse response' };
  }

}

export default safeParseResponse;