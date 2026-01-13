/**
 * Selector Utilities
 * 
 * Helpers for creating memoized selectors.
 */

/**
 * Create a selector function with memoization
 */
export function createSelector<State, Result>(
  selector: (state: State) => Result
): (state: State) => Result {
  let lastState: State | undefined;
  let lastResult: Result;

  return (state: State) => {
    if (state === lastState) {
      return lastResult;
    }
    lastState = state;
    lastResult = selector(state);
    return lastResult;
  };
}

/**
 * Create a selector from multiple input selectors
 */
export function createDerivedSelector<State, Inputs extends readonly unknown[], Result>(
  inputSelectors: { [K in keyof Inputs]: (state: State) => Inputs[K] },
  combiner: (...inputs: Inputs) => Result
): (state: State) => Result {
  let lastInputs: Inputs | undefined;
  let lastResult: Result;

  return (state: State) => {
    const inputs = inputSelectors.map(selector => selector(state)) as unknown as Inputs;
    
    // Check if inputs have changed
    const inputsChanged = !lastInputs || inputs.some((input, i) => input !== lastInputs![i]);
    
    if (!inputsChanged) {
      return lastResult;
    }
    
    lastInputs = inputs;
    lastResult = combiner(...inputs);
    return lastResult;
  };
}

/**
 * Shallow equal comparison for objects
 */
export function shallowEqual<T extends object>(a: T, b: T): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if ((a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Create a selector that only triggers re-renders when the selected value changes (shallow comparison)
 */
export function createShallowSelector<State, Result extends object>(
  selector: (state: State) => Result
): (state: State) => Result {
  let lastResult: Result;

  return (state: State) => {
    const result = selector(state);
    if (lastResult && shallowEqual(result, lastResult)) {
      return lastResult;
    }
    lastResult = result;
    return result;
  };
}
