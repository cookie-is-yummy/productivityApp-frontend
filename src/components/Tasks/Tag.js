import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

/**
 * Tag component with color support
 */
const Tag = ({ tag, onClick, onDelete }) => {
  // Extract color information from tag if present (format: "tagname [color]")
  const [isHovering, setIsHovering] = useState(false);
  let tagName = tag;
  let tagColor = '';

  const colorMatch = tag.match(/^(.*?)\s*\[(.*?)\]$/);
  if (colorMatch) {
    tagName = colorMatch[1].trim();
    tagColor = colorMatch[2].trim();
  }

  // Map color names to their CSS variables or hex values
  const colorMap = {
    'red': '#fee2e2',
    'orange': '#fed7aa',
    'yellow': '#fef9c3',
    'green': '#dcfce7',
    'blue': '#e0f2fe',
    'purple': '#f3e8ff',
    'pink': '#fce7f3',
  };

  const style = tagColor ? {
    backgroundColor: colorMap[tagColor] || tagColor,
    color: tagColor === 'yellow' || tagColor === 'green' ? '#333' : ''
  } : {};

  return (
    <span
      className="tag"
      data-tag={tagName.toLowerCase()}
      onClick={onClick}
      style={style}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      role="button"
      tabIndex="0"
      aria-label={`Tag: ${tagName}`}
    >
      {tagName}
      {isHovering && (
        <button
          type="button"
          className="tag-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Remove tag ${tagName}`}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      )}
    </span>
  );
};

export default Tag;