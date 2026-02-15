/**
 * Matrix theme configurations and character sets
 * Used by all Matrix 3D sub-components.
 */

import * as THREE from 'three';

export const THEMES = {
  'matrix-green': {
    primary: new THREE.Color(0x00ff41),
    secondary: new THREE.Color(0x003b00),
    glow: new THREE.Color(0x39ff14),
  },
  'cyber-blue': {
    primary: new THREE.Color(0x00d4ff),
    secondary: new THREE.Color(0x001a33),
    glow: new THREE.Color(0x00ffff),
  },
  'purple-haze': {
    primary: new THREE.Color(0xb794f6),
    secondary: new THREE.Color(0x2d1b4e),
    glow: new THREE.Color(0xe9d5ff),
  },
  'amber-glow': {
    primary: new THREE.Color(0xfbbf24),
    secondary: new THREE.Color(0x451a03),
    glow: new THREE.Color(0xfde68a),
  },
};

export type ThemeName = keyof typeof THEMES;

// Matrix characters (Katakana + symbols)
export const MATRIX_CHARS = [
  ...'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ'.split(''),
  ...'01'.split(''),
  ...':・."=*+-<>¦|ｯﾞ'.split(''),
];
