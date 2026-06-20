export function reportError(error, context = {}) {
  // If we had Sentry, we would do: Sentry.captureException(error, { extra: context });
  console.error('[ErrorReporter]', error, context);
}
