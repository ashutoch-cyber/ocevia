import React, { createContext, useContext, useEffect, useState } from "react";

const EventContext = createContext();

const defaultEvents = {
  pastEvents: [],
  upcomingEvents: [],
};

function loadEvents() {
  try {
    const data = localStorage.getItem("events");
    return data ? JSON.parse(data) : defaultEvents;
  } catch {
    return defaultEvents;
  }
}

function saveEvents(events) {
  localStorage.setItem("events", JSON.stringify(events));
}

export function EventProvider({ children }) {
  const [events, setEvents] = useState(loadEvents());

  useEffect(() => {
    saveEvents(events);
  }, [events]);

  const addEvent = (type, event) => {
    setEvents((prev) => ({
      ...prev,
      [type]: [...prev[type], { ...event, id: Date.now() + Math.random() }],
    }));
  };

  const editEvent = (type, event) => {
    setEvents((prev) => ({
      ...prev,
      [type]: prev[type].map((e) => (e.id === event.id ? event : e)),
    }));
  };

  const deleteEvent = (type, id) => {
    setEvents((prev) => ({
      ...prev,
      [type]: prev[type].filter((e) => e.id !== id),
    }));
  };

  return (
    <EventContext.Provider value={{ events, addEvent, editEvent, deleteEvent }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEventContext() {
  return useContext(EventContext);
}
