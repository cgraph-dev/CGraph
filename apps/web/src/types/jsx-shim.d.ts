/**
 * JSX Type Shim for React 19 Compatibility
 * 
 * React 19 changed the JSX runtime types, causing compatibility issues with
 * third-party libraries like @heroicons/react, qrcode.react, and react-router-dom
 * that haven't yet updated their type definitions.
 * 
 * The issue is that React 19's stricter types require ReactElement to have 
 * a `children` property to be assignable to ReactNode, but many libraries 
 * return ReactElement without this constraint.
 * 
 * This workaround makes the JSX.Element type compatible with these libraries.
 * @see https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/69006
 */

import type { ReactElement } from 'react';

declare global {
  namespace React {
    interface ReactPortal {
      // Make children optional to allow ReactElement to be assignable
      children?: React.ReactNode;
    }
  }
}

export {};
