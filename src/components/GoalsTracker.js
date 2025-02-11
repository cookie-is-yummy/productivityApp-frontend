import React, { useState, useEffect } from "react";
import axios from '../axiosInstance';

const GoalsTracker = () => {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({ title: "", deadline: "", priority: "Normal" });
  const [subtaskText, setSubtaskText] = useState({}); // store subtasks per goal id

  useEffect(() => {
    axios.get("/api/goals")
      .then(response => setGoals(response.data))
      .catch(error => console.error("Error fetching goals:", error));
  }, []);

  const addGoal = () => {
    if(newGoal.title && newGoal.deadline) {
      axios.post("/api/goals", newGoal)
        .then(response => {
          setGoals([...goals, { ...newGoal, id: response.data.id, subtasks: "[]" }]);
          setNewGoal({ title: "", deadline: "", priority: "Normal" });
        });
    }
  };

  const addSubtask = (goalId) => {
    const text = subtaskText[goalId];
    if(text) {
      // In a complete app, send to backend; here we update locally.
      setGoals(goals.map(goal => {
        if(goal.id === goalId) {
          const currentSubtasks = JSON.parse(goal.subtasks);
          const newSubtask = { id: Date.now(), title: text, completed: false };
          return { ...goal, subtasks: JSON.stringify([...currentSubtasks, newSubtask]) };
        }
        return goal;
      }));
      setSubtaskText({ ...subtaskText, [goalId]: "" });
    }
  };

  return (
    <div>
      <h2>Goals &amp; Deadlines</h2>
      <div className="goal-form">
        <input
          type="text"
          placeholder="Goal title"
          value={newGoal.title}
          onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
        />
        <input
          type="date"
          value={newGoal.deadline}
          onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })}
        />
        <select
          value={newGoal.priority}
          onChange={e => setNewGoal({ ...newGoal, priority: e.target.value })}
        >
          <option value="Important">Important</option>
          <option value="Normal">Normal</option>
          <option value="Not Important">Not Important</option>
        </select>
        <button onClick={addGoal}>Add Goal</button>
      </div>
      <ul>
        {goals.map(goal => (
          <li key={goal.id} className="goal-item">
            <h3>{goal.title}</h3>
            <p>Deadline: {goal.deadline}</p>
            <p>Priority: {goal.priority}</p>
            <strong>Subtasks:</strong>
            <ul>
              {(JSON.parse(goal.subtasks) || []).map(sub => (
                <li key={sub.id}>
                  <input type="checkbox" checked={sub.completed} readOnly /> {sub.title}
                </li>
              ))}
            </ul>
            <input
              type="text"
              placeholder="New subtask"
              value={subtaskText[goal.id] || ""}
              onChange={e => setSubtaskText({ ...subtaskText, [goal.id]: e.target.value })}
            />
            <button onClick={() => addSubtask(goal.id)}>Add Subtask</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GoalsTracker;