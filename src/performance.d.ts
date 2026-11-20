/** Optional client-local instrumentation supplied by Combat Tools during a capture. */
declare var pneumaPerformance: {
  work(module:string, handler:string, card?:string, cause?:string):()=>void;
} | undefined;
