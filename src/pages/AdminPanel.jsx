import React, { useState } from "react";
import { useEventContext } from "../context/EventContext";
import styles from "../components/NewsEvents.module.css";

const emptyEvent = { title: "", date: "", description: "", location: "" };

function EventForm({ type, onSubmit, initial, onCancel }) {
  const [form, setForm] = useState(initial || emptyEvent);
  const [error, setError] = useState("");
  const isUpcoming = type === "upcomingEvents";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date.trim() || !form.description.trim() || (isUpcoming && !form.location.trim())) {
      setError("Please fill all required fields.");
      return;
    }
    setError("");
    onSubmit({ ...form });
    setForm(emptyEvent);
  };

  return (
    <form className={styles.eventCard} style={{ marginBottom: 16 }} onSubmit={handleSubmit}>
      <input
        name="title"
        placeholder="Title"
        value={form.title}
        onChange={handleChange}
        className={styles.eventTitle}
        style={{ marginBottom: 8 }}
      />
      <input
        name="date"
        type="date"
        placeholder="Date"
        value={form.date}
        onChange={handleChange}
        className={styles.eventDate}
        style={{ marginBottom: 8 }}
      />
      {isUpcoming && (
        <input
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
          className={styles.eventLocation}
          style={{ marginBottom: 8 }}
        />
      )}
      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
        className={styles.eventDesc}
        style={{ marginBottom: 8 }}
      />
      {error && <div style={{ color: "#e74c3c", marginBottom: 8 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className={styles.detailsBtn} style={{ flex: 1 }}>
          {initial ? "Save" : "Add Event"}
        </button>
        {onCancel && (
          <button type="button" className={styles.detailsBtn} style={{ background: "#aaa", flex: 1 }} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function EventManager({ type, label }) {
  const { events, addEvent, editEvent, deleteEvent } = useEventContext();
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [success, setSuccess] = useState("");

  const handleAdd = (event) => {
    addEvent(type, event);
    setSuccess("Event Added!");
    setTimeout(() => setSuccess(""), 1200);
  };
  const handleEdit = (event) => {
    editEvent(type, event);
    setEditing(null);
    setSuccess("Event Updated!");
    setTimeout(() => setSuccess(""), 1200);
  };
  const handleDelete = (id) => {
    deleteEvent(type, id);
    setConfirmDelete(null);
    setSuccess("Event Deleted!");
    setTimeout(() => setSuccess(""), 1200);
  };

  return (
    <div className={styles.pastEventsCol}>
      <h2 className={styles.heading}>{label}</h2>
      <EventForm
        type={type}
        onSubmit={handleAdd}
      />
      {success && <div style={{ color: "#27ae60", marginBottom: 8 }}>{success}</div>}
      <div className={styles.upcomingList}>
        {events[type].map((event) => (
          <div className={styles.eventCard} key={event.id}>
            {editing === event.id ? (
              <EventForm
                type={type}
                initial={event}
                onSubmit={(e) => handleEdit({ ...e, id: event.id })}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <>
                <div className={styles.eventTitle}>{event.title}</div>
                <div className={styles.eventDate}>{event.date}{event.location && (
                  <span className={styles.eventLocation}> | {event.location}</span>
                )}</div>
                <div className={styles.eventDesc}>{event.description}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button className={styles.detailsBtn} onClick={() => setEditing(event.id)} style={{ flex: 1 }}>
                    Edit
                  </button>
                  <button
                    className={styles.detailsBtn}
                    style={{ background: "#e74c3c", flex: 1 }}
                    onClick={() => setConfirmDelete(event.id)}
                  >
                    Delete
                  </button>
                </div>
                {confirmDelete === event.id && (
                  <div style={{ marginTop: 8, color: "#e74c3c" }}>
                    Are you sure? <button onClick={() => handleDelete(event.id)} style={{ color: "#fff", background: "#e74c3c", border: "none", borderRadius: 6, padding: "2px 10px", marginLeft: 8 }}>Yes</button>
                    <button onClick={() => setConfirmDelete(null)} style={{ marginLeft: 8 }}>No</button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPanel() {
  return (
    <section className={styles.newsEventsSection}>
      <div className={styles.container}>
        <EventManager type="pastEvents" label="Past Events Manager" />
        <EventManager type="upcomingEvents" label="Upcoming Events Manager" />
      </div>
    </section>
  );
}
