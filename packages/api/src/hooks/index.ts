// Export all individual hooks
export * from './auth';
export * from './supplements';
export * from './chat';
export * from './labs';
export * from './user';
export * from './summaries';

// Export convenience hooks under a namespace to avoid conflicts
export * as ConvenienceHooks from './convenience';

// Export query keys for external use
export { authKeys } from './auth';
export { supplementKeys } from './supplements';
export { chatKeys } from './chat';
export { labKeys } from './labs';
export { userKeys } from './user';
export { summaryKeys } from './summaries';