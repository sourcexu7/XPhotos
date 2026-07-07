export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    console.warn('Runtime is edge, skipping instrumentation setup.')
  }
}
