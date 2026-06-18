export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function errorResponse(message, status = 400) {
  return jsonResponse({ message }, status)
}
