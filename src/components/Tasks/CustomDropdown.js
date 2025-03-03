import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';

/**
 * Custom dropdown component with support for subcategories
 */
const CustomDropdown = ({ value, onChange, options, placeholder, className, onSubcategoryClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`custom-dropdown ${className || ''}`} ref={dropdownRef}>
      <button
        type="button"
        className="dropdown-selected"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {options.find(opt => opt.value === value)?.label || placeholder || 'Select...'}
        <FontAwesomeIcon icon={faCaretDown} className={`dropdown-caret ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="dropdown-menu" role="listbox">
          {options.map(option => (
            <div
              key={option.value}
              className={`dropdown-item ${option.value === value ? 'selected' : ''} ${option.isSubcategory ? 'subcategory' : ''}`}
              onClick={() => {
                if (option.isSubcategory) {
                  // Call the subcategory click handler instead of setting value
                  if (onSubcategoryClick) {
                    onSubcategoryClick(option.value);
                  }
                } else {
                  onChange(option.value);
                  setIsOpen(false);
                }
              }}
              role="option"
              aria-selected={option.value === value}
            >
              {option.isSubcategory && <span className="subcategory-indent">└ </span>}
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;