import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

/**
 * Color picker component for tag colors
 */
const ColorPicker = ({ onSelect, onClose }) => {
  const colors = [
    { name: 'red', hex: '#fee2e2' },
    { name: 'orange', hex: '#fed7aa' },
    { name: 'yellow', hex: '#fef9c3' },
    { name: 'green', hex: '#dcfce7' },
    { name: 'blue', hex: '#e0f2fe' },
    { name: 'purple', hex: '#f3e8ff' },
    { name: 'pink', hex: '#fce7f3' },
  ];

  return (
    <div className="color-picker" role="dialog" aria-labelledby="color-picker-title">
      <div className="color-picker-header">
        <h4 id="color-picker-title">Choose a color</h4>
        <button
          type="button"
          className="close-btn"
          onClick={onClose}
          aria-label="Close color picker"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div className="color-options">
        {colors.map(color => (
          <button
            key={color.name}
            type="button"
            className="color-option"
            style={{ backgroundColor: color.hex }}
            onClick={() => {
              onSelect(color.name);
              onClose();
            }}
            aria-label={`Select ${color.name} color`}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;