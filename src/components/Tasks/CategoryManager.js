import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import CustomDropdown from './CustomDropdown';

/**
 * Category management component
 */
const CategoryManager = ({ categories, onAddCategory, onDeleteCategory, onClose }) => {
  const [newCategory, setNewCategory] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Organize categories by parent-child relationship for display
  const categoriesByParent = {};
  categories.forEach(cat => {
    const parentId = cat.parent_id || 'root';
    if (!categoriesByParent[parentId]) {
      categoriesByParent[parentId] = [];
    }
    categoriesByParent[parentId].push(cat);
  });

  // Filter out subcategories for parent dropdown
  const topLevelCategories = categories.filter(cat => !cat.parent_id);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    onAddCategory(
      newCategory.trim(),
      parentCategory ? parentCategory : null
    );
    setNewCategory('');
  };

  const handleRenameCategory = (categoryId) => {
    if (!editingName.trim()) {
      setEditingCategory(null);
      return;
    }

    setEditingCategory(null);
    onAddCategory(editingName, categories.find(cat => cat.id === categoryId).parent_id, categoryId);
  };

  const renderCategoryTree = (parentId = 'root') => {
    const children = categoriesByParent[parentId] || [];
    return children.map(category => (
      <div key={category.id} className="category-item">
        {parentId !== 'root' && <span className="category-indent" aria-hidden="true">└ </span>}

        {editingCategory === category.id ? (
          <div className="category-edit-form">
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameCategory(category.id);
                } else if (e.key === 'Escape') {
                  setEditingCategory(null);
                }
              }}
              onBlur={() => handleRenameCategory(category.id)}
              aria-label="Category name"
            />
          </div>
        ) : (
          <>
            <span className="category-name">{category.name}</span>
            {category.id !== 'inbox' && (
              <div className="category-actions">
                <button
                  type="button"
                  className="category-edit-btn"
                  onClick={() => {
                    setEditingCategory(category.id);
                    setEditingName(category.name);
                  }}
                  title="Rename category"
                  aria-label={`Rename ${category.name} category`}
                >
                  <FontAwesomeIcon icon={faPen} />
                </button>
                <button
                  type="button"
                  className="category-delete-btn"
                  onClick={() => onDeleteCategory(category.id)}
                  title="Delete category (tasks will be moved to Inbox)"
                  aria-label={`Delete ${category.name} category`}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            )}
          </>
        )}

        {categoriesByParent[category.id] && (
          <div className="nested-categories">
            {renderCategoryTree(category.id)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="category-manager" role="dialog" aria-labelledby="category-manager-title">
      <div className="category-manager-header">
        <h4 id="category-manager-title">Manage Categories</h4>
        <button
          type="button"
          className="close-btn"
          onClick={onClose}
          aria-label="Close category manager"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <form className="category-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="new-category">New Category</label>
          <input
            id="new-category"
            type="text"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            placeholder="Category name"
          />
        </div>

        {topLevelCategories.length > 0 && (
          <div className="form-group">
            <label id="parent-category-label">Parent Category (optional)</label>
            <CustomDropdown
              value={parentCategory}
              onChange={setParentCategory}
              options={[
                { value: '', label: 'None (Top Level)' },
                ...topLevelCategories.map(cat => ({ value: cat.id, label: cat.name }))
              ]}
              placeholder="None (Top Level)"
              aria-labelledby="parent-category-label"
            />
          </div>
        )}

        <button type="submit" className="btn-primary">
          Add Category
        </button>
      </form>

      {categories.length > 0 && (
        <div className="existing-categories">
          <h5>Existing Categories</h5>
          <div className="category-list" role="list">
            {renderCategoryTree()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;