function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function GET(req) {
  return jsonResponse({ status: 'ok', time: new Date().toISOString() })
}
