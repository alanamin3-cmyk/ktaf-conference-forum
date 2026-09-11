/** Bound read-only portal requests even when the upstream service never replies.
 * This does not cancel a write or retry an operation behind the user's back.
 */
export async function withPortalTimeout<T>(
  request: PromiseLike<T>,
  timeoutMs = 15_000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(request),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Portal request timed out")), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
