import type { TransitionConfig } from 'svelte/transition';

type TransitionOptions = Partial<TransitionConfig> & Record<string, any>;

export function reduceMotion(options?: TransitionOptions): TransitionOptions;
