const listeners = new Set();

export function subscribeAuthRequired(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitAuthRequired(payload = {}) {
  listeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (error) {
      console.log('AUTH EVENT LISTENER ERROR =', error?.message);
    }
  });
}