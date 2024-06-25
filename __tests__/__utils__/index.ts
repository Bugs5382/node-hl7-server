import EventEmitter from 'node:events'

/** @internal */
export const sleep = async (ms: number): Promise<unknown> => {
  return await new Promise(resolve => setTimeout(resolve, ms))
}

/** @internal */
export const expectEvent = async <T=any>(emitter: EventEmitter, name: string | symbol): Promise<T> => {
  return await new Promise<T>((resolve) => { emitter.once(name, resolve) })
}

/** @internal */
export interface Deferred<T=any> {
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
  promise: Promise<T>
}

/** @internal */
export const createDeferred = <T=any>(noUncaught?: boolean): Deferred<T> => {
  const dfd: any = {}
  dfd.promise = new Promise((resolve, reject) => {
    dfd.resolve = resolve
    dfd.reject = reject
  })
  /* istanbul ignore next */
  if (noUncaught === false) {
    dfd.promise.catch(() => {})
  }
  return dfd
}

/** @internal */
export const generateLargeBase64String = (sizeInKb: number = 200) => {
  // Size in bytes (200KB = 200 * 1024 bytes)
  const size = sizeInKb * 1024;

  // Generate string of 'a' characters
  let largeString = "";
  for (let i = 0; i < size; i++) {
    largeString += "a";
  }

  return Buffer.from(largeString).toString("base64");
};
