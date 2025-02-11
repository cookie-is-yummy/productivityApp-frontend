import React, { useState, useEffect } from "react";
import axios from '../axiosInstance';

const Journal = () => {
  const [entries, setEntries] = useState([]);
  const [entryText, setEntryText] = useState("");

  useEffect(() => {
    axios.get("/api/journal")
      .then(response => setEntries(response.data))
      .catch(error => console.error("Error fetching journal entries:", error));
  }, []);

  const addEntry = () => {
    if(entryText.trim()) {
      axios.post("/api/journal", { content: entryText })
        .then(response => {
          setEntries([{ id: response.data.id, content: entryText, date: new Date().toLocaleString() }, ...entries]);
          setEntryText("");
        });
    }
  };

  return (
    <div>
      <h2>Journal &amp; Ideas</h2>
      <div className="journal-entry">
        <textarea
          placeholder="Write your journal entry or idea here..."
          value={entryText}
          onChange={e => setEntryText(e.target.value)}
          rows="4"
          cols="50"
        />
        <br />
        <button onClick={addEntry}>Add Entry</button>
      </div>
      <div className="journal-list">
        {entries.map(entry => (
          <div key={entry.id} className="journal-item">
            <p><em>{entry.date}</em></p>
            <p>{entry.content}</p>
            <hr />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Journal;