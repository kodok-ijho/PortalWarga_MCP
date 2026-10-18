export function jsonResult(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

export function errorResult(error) {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
}

export function withErrorHandling(handler) {
  return async (args) => {
    try {
      return jsonResult(await handler(args));
    } catch (error) {
      return errorResult(error);
    }
  };
}
