import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

/**
 * Date picker modal component
 */
const DatePickerModal = ({ selectedDate, onSelect, onClose }) => {
  const [date, setDate] = useState(selectedDate || '');
  const [showCalendar, setShowCalendar] = useState(true);

  // Get current date info for the calendar
  const today = new Date();
  const currentMonth = date ? new Date(date).getMonth() : today.getMonth();
  const currentYear = date ? new Date(date).getFullYear() : today.getFullYear();

  // Set up calendar navigation state
  const [displayMonth, setDisplayMonth] = useState(currentMonth);
  const [displayYear, setDisplayYear] = useState(currentYear);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  /**
   * Calendar navigation functions
   */
  const goToPreviousMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  /**
   * Calendar helper functions
   */
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  /**
   * Renders calendar days for the current month and year
   */
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(displayMonth, displayYear);
    const firstDay = getFirstDayOfMonth(displayMonth, displayYear);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty" aria-hidden="true"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = date === dateString;
      const isToday =
        day === today.getDate() &&
        displayMonth === today.getMonth() &&
        displayYear === today.getFullYear();

      days.push(
        <button
          key={day}
          type="button"
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => setDate(dateString)}
          aria-label={`${monthNames[displayMonth]} ${day}, ${displayYear}`}
          aria-selected={isSelected}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="date-picker-modal" role="dialog" aria-labelledby="date-picker-title">
      <div className="date-picker-header">
        <h4 id="date-picker-title">Select Due Date</h4>
        <button
          type="button"
          className="close-btn"
          onClick={onClose}
          aria-label="Close date picker"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div className="date-picker-content">
        {showCalendar ? (
          <div className="custom-calendar">
            <div className="calendar-header">
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={goToPreviousMonth}
                aria-label="Previous month"
              >
                &lt;
              </button>
              <div className="calendar-title" aria-live="polite">
                {monthNames[displayMonth]} {displayYear}
              </div>
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={goToNextMonth}
                aria-label="Next month"
              >
                &gt;
              </button>
            </div>
            <div className="calendar-weekdays" role="rowgroup">
              <div role="columnheader">Sun</div>
              <div role="columnheader">Mon</div>
              <div role="columnheader">Tue</div>
              <div role="columnheader">Wed</div>
              <div role="columnheader">Thu</div>
              <div role="columnheader">Fri</div>
              <div role="columnheader">Sat</div>
            </div>
            <div className="calendar-days" role="grid">
              {renderCalendarDays()}
            </div>
            <button
              type="button"
              className="calendar-toggle-btn"
              onClick={() => setShowCalendar(false)}
            >
              Switch to Date Input
            </button>
          </div>
        ) : (
          <>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="date-input"
              aria-label="Enter due date"
            />
            <button
              type="button"
              className="calendar-toggle-btn"
              onClick={() => setShowCalendar(true)}
            >
              Switch to Calendar View
            </button>
          </>
        )}
        <div className="date-picker-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              onSelect(date);
              onClose();
            }}
          >
            Apply Date
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setDate('');
              onSelect('');
              onClose();
            }}
          >
            Clear Date
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatePickerModal;