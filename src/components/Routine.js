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
    <div className="section routine relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Daily Schedule</h2>
        <div className="flex gap-2">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`px-3 py-1 rounded-lg ${
                day === d ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {d.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setShowTimes(true)}
        onMouseLeave={() => setShowTimes(false)}
      >
        {/* Time Labels */}
        {showTimes && (
          <div className="absolute -left-20 top-0 w-16 space-y-2 text-sm text-gray-500">
            {routineSlots.map(slot => (
              <div
                key={`time-${slot.id}`}
                style={{ height: `${calculateSlotHeight(slot.duration)}px` }}
                className="flex items-center justify-end pr-2"
              >
                {new Date(`2000-01-01T${slot.time}`).toLocaleTimeString([], {
                  hour: 'numeric', minute: '2-digit'
                })}
              </div>
            ))}
          </div>
        )}

        {/* Routine Slots */}
        <div className="space-y-2">
          {routineSlots.map(slot => {
            const todo = todos.find(t => t.id === slot.assigned_todo_id);

            return (
              <div
                key={slot.id}
                className={`routine-slot group relative p-4 rounded-xl transition-all
                  ${slot.locked_in ? 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-50/50 to-white' : 'bg-white'}
                  ${slot.locked_in ? 'cursor-pointer' : 'opacity-75'}`}
                style={{ height: `${calculateSlotHeight(slot.duration)}px` }}
                onClick={() => openAssignmentModal(slot)}
              >
                <div className="flex items-center h-full">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{slot.description}</p>
                    {todo && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {todo.text}
                        </span>
                        {todo.duration && (
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {todo.duration}m
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {!slot.assigned_todo_id && (
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-gray-400 group-hover:text-blue-600">+</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assignment Modal */}
       {selectedSlot && (
      <Dialog
        open={!!selectedSlot}
        onClose={() => setSelectedSlot(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl p-6">
            <Dialog.Title className="text-xl font-semibold mb-4">
              Assign Task to {selectedSlot.time}
            </Dialog.Title>

            <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Task</label>
                  <div className="relative">
                    <select
                      value={selectedTodo}
                      onChange={(e) => setSelectedTodo(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a task...</option>
                      {todos.map(todo => (
                        <option key={todo.id} value={todo.id}>
                          {todo.text} {todo.duration && `(${todo.duration}min)`}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={assignTodo}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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