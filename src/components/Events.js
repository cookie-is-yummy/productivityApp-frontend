import React, { useState, useEffect } from "react";
import axios from '../axiosInstance';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [eventData, setEventData] = useState({ title: "", date: "", description: "" });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = () => {
    axios.get("/api/events")
      .then(response => {
        setEvents(response.data);
      })
      .catch(error => console.error("Error fetching events:", error));
  };

  const addEvent = () => {
    if (eventData.title && eventData.date) {
      axios.post("/api/events", eventData)
        .then(response => {
          setEvents([...events, { id: response.data.id, ...eventData }]);
          setEventData({ title: "", date: "", description: "" });
        })
        .catch(error => console.error("Error adding event:", error));
    }
  };

  return (
    <div>
      <h2>Events &amp; Schedules</h2>
      <div className="event-form">
        <input
          type="text"
          placeholder="Event title"
          value={eventData.title}
          onChange={e => setEventData({ ...eventData, title: e.target.value })}
        />
        <input
          type="date"
          value={eventData.date}
          onChange={e => setEventData({ ...eventData, date: e.target.value })}
        />
        <textarea
          placeholder="Event description"
          value={eventData.description}
          onChange={e => setEventData({ ...eventData, description: e.target.value })}
        />
        <button onClick={addEvent}>Add Event</button>
      </div>
      <ul>
        {events.map(event => (
          <li key={event.id}>
            <h3>{event.title}</h3>
            <p>Date: {event.date}</p>
            <p>{event.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Events;