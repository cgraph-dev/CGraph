import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { AVATAR_BORDERS } from './constants';

export const CustomizeDemo = memo(function CustomizeDemo() {
  const [selectedBorder, setSelectedBorder] = useState('emerald');
  const [username, setUsername] = useState('YourName');

  const currentBorder = AVATAR_BORDERS.find((b) => b.id === selectedBorder);

  return (
    <div className="demo-customize">
      {/* Preview */}
      <div className="demo-customize__preview">
        <motion.div
          className="demo-avatar-preview"
          style={{
            background: currentBorder?.style !== 'none' ? currentBorder?.style : 'transparent',
            padding: currentBorder?.style !== 'none' ? 4 : 0,
          }}
          layout
        >
          <div className="demo-avatar-preview__inner">
            <span>😎</span>
          </div>
        </motion.div>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="demo-customize__name"
          maxLength={20}
        />
        <span className="demo-customize__title">✨ Early Adopter</span>
      </div>

      {/* Border selector */}
      <div className="demo-customize__options">
        <span className="demo-customize__label">Avatar Border</span>
        <div className="demo-customize__borders">
          {AVATAR_BORDERS.map((border) => (
            <motion.button
              key={border.id}
              type="button"
              className={`demo-border-option ${selectedBorder === border.id ? 'active' : ''}`}
              style={{
                background: border.style !== 'none' ? border.style : 'rgba(255,255,255,0.1)',
              }}
              onClick={() => setSelectedBorder(border.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {selectedBorder === border.id && <span>✓</span>}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
});
