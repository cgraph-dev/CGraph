/**
 * framer-motion mock for vitest
 *
 * This file is used via Vite's resolve.alias to completely bypass
 * compilation of the real framer-motion package (219+ ESM files via motion-dom).
 * Without this alias, vitest hangs indefinitely during module collection.
 *
 * @since v0.9.54
 */
import { createElement } from 'react';
import type { ReactNode } from 'react';

type AnyProps = Record<string, unknown>;

const motionEl = (tag: string) => {
  const Component = (props: AnyProps & { ref?: unknown }) => {
    const {
      children,
      ref,
      initial: _i,
      animate: _a,
      exit: _e,
      transition: _t,
      variants: _v,
      whileHover: _wh,
      whileTap: _wt,
      whileInView: _wi,
      layout: _l,
      layoutId: _lid,
      onAnimationComplete: _oac,
      ...rest
    } = props;
     
    return createElement(tag, { ...rest, ref }, children as ReactNode);
  };
  Component.displayName = `motion.${tag}`;
  return Component;
};

export const motion = {
  a: motionEl('a'),
  aside: motionEl('aside'),
  button: motionEl('button'),
  circle: motionEl('circle'),
  div: motionEl('div'),
  form: motionEl('form'),
  h1: motionEl('h1'),
  h2: motionEl('h2'),
  h3: motionEl('h3'),
  h4: motionEl('h4'),
  header: motionEl('header'),
  img: motionEl('img'),
  input: motionEl('input'),
  label: motionEl('label'),
  li: motionEl('li'),
  line: motionEl('line'),
  nav: motionEl('nav'),
  p: motionEl('p'),
  path: motionEl('path'),
  span: motionEl('span'),
  svg: motionEl('svg'),
  textarea: motionEl('textarea'),
  tr: motionEl('tr'),
  ul: motionEl('ul'),
};

export const AnimatePresence = ({ children }: { children: ReactNode }) => children;

export const useMotionValue = (initial: number) => ({
  get: () => initial,
  set: () => {},
  onChange: () => () => {},
  on: () => () => {},
});

export const useTransform = (val: unknown, _from?: unknown, _to?: unknown) => val;
export const useSpring = (val: unknown) => val;
export const useScroll = () => ({
  scrollYProgress: { get: () => 0, onChange: () => () => {}, on: () => () => {} },
});
export const useAnimation = () => ({
  start: async () => {},
  stop: () => {},
  set: () => {},
});
export const useInView = () => true;
export const useReducedMotion = () => false;

export const LayoutGroup = ({ children }: { children: ReactNode }) => children;

export const Reorder = {
  Group: motionEl('ul'),
  Item: motionEl('li'),
};
