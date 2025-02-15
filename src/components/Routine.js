import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';

function Routine() {
  const getToday = () => new Date().toLocaleString('en-US', { weekday: 'long' });

  const [routineSlots, setRoutineSlots] = useState([]);
  const [day, setDay] = useState(getToday());
  const [todos, setTodos] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTodo, setSelectedTodo] = useState('');
  const [showTimes, setShowTimes] = useState(false);

  const calculateSlotHeight = (duration) => Math.max(duration * 2, 60);

  useEffect(() => {
    fetch(`https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com/api/routine/${day}`)
      .then(res => res.json())
      .then(setRoutineSlots)
      .catch(console.error);
  }, [day]);

  useEffect(() => {
    fetch('https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com/api/todos')
      .then(res => res.json())
      .then(setTodos)
      .catch(console.error);
  }, []);

  const openAssignmentModal = (slot) => {
    if (slot.locked_in) setSelectedSlot(slot);
  };

  const assignTodo = () => {
    if (!selectedSlot || !selectedTodo) return;

    fetch(`https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com/api/routine/${day}/${selectedSlot.id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ assigned_todo_id: parseInt(selectedTodo) })
    })
      .then(res => res.json())
      .then(updatedSlot => {
        setRoutineSlots(routineSlots.map(slot =>
          slot.id === updatedSlot.id ? updatedSlot : slot
        ));
        setSelectedSlot(null);
        setSelectedTodo('');
      })
      .catch(console.error);
  };

  return (
    <div className="routine">
      <div className="routine-header">
        <h2 className="routine-title">Daily Schedule</h2>
        <div className="days-container">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`day-button ${day === d ? 'selected' : ''}`}
            >
              {d.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <div
        className="time-container"
        onMouseEnter={() => setShowTimes(true)}
        onMouseLeave={() => setShowTimes(false)}
      >
        {showTimes && (
          <div className="time-labels">
            {routineSlots.map(slot => (
              <div
                key={`time-${slot.id}`}
                style={{ height: `${calculateSlotHeight(slot.duration)}px` }}
                className="time-label"
              >
                {new Date(`2000-01-01T${slot.time}`).toLocaleTimeString([], {
                  hour: 'numeric', minute: '2-digit'
                })}
              </div>
            ))}
          </div>
        )}

        <div className="slots-container">
          {routineSlots.map(slot => {
            const todo = todos.find(t => t.id === slot.assigned_todo_id);

            return (
              <div
                key={slot.id}
                className={`routine-slot ${slot.locked_in ? 'locked-in' : ''}`}
                style={{ height: `${calculateSlotHeight(slot.duration)}px` }}
                onClick={() => openAssignmentModal(slot)}
              >
                <div className="slot-content">
                  <div className="slot-main">
                    <p className="slot-description">{slot.description}</p>
                    {todo && (
                      <div className="todo-info">
                        <span className="todo-badge">
                          {todo.text}
                        </span>
                        {todo.duration && (
                          <span className="todo-duration">
                            <svg className="duration-icon" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {todo.duration}m
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {!slot.assigned_todo_id && (
                    <div className="add-button">
                      <span className="add-icon">+</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedSlot && (
        <Dialog
          open={!!selectedSlot}
          onClose={() => setSelectedSlot(null)}
          className="modal"
        >
          <div className="modal-overlay" />
          <div className="modal-container">
            <Dialog.Panel className="modal-panel">
              <Dialog.Title className="modal-title">
                Assign Task to {selectedSlot.time}
              </Dialog.Title>

              <div className="modal-content">
                <div className="form-group">
                  <label className="form-label">Select Task</label>
                  <div className="select-container">
                    <select
                      value={selectedTodo}
                      onChange={(e) => setSelectedTodo(e.target.value)}
                      className="select-input"
                    >
                      <option value="">Choose a task...</option>
                      {todos.map(todo => (
                        <option key={todo.id} value={todo.id}>
                          {todo.text} {todo.duration && `(${todo.duration}min)`}
                        </option>
                      ))}
                    </select>
                    <div className="select-arrow">
                      <svg className="arrow-icon" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="modal-button cancel"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={assignTodo}
                    className="modal-button confirm"
                  >
                    Assign Task
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </div>
  );
}

export default Routine;