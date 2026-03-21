import React, { useRef, useEffect, useState } from "react";
import styles from "./NewsEvents.module.css";
import { useEventContext } from "../context/EventContext";

export default function NewsEvents() {
  const { events } = useEventContext();
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);
  const wrapperRef = useRef(null);
  const cardHeight = useRef(0);

  // Step-based auto-scroll logic
  useEffect(() => {
    if (!wrapperRef.current) return;
    const firstCard = wrapperRef.current.querySelector(`.${styles.eventCard}`);
    if (firstCard) cardHeight.current = firstCard.offsetHeight + 32; // margin
  }, [events.pastEvents.length]);

  useEffect(() => {
    if (!events.pastEvents.length) return;
    function next() {
      setCurrent((prev) => (prev + 1) % events.pastEvents.length);
    }
    intervalRef.current = setInterval(next, 2500);
    return () => clearInterval(intervalRef.current);
  }, [events.pastEvents.length]);

  // Pause on hover
  const handleMouseEnter = () => clearInterval(intervalRef.current);
  const handleMouseLeave = () => {
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % events.pastEvents.length);
    }, 2500);
  };

  // Only show full cards, step scroll
  const getTranslate = () => {
    return `translateY(-${current * cardHeight.current}px)`;
  };

  return (
    <section className={styles.newsEventsSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionLabel}>NEWS AND EVENTS</div>
        <h2 className={styles.sectionTitle}>Past Highlights and Upcoming Sessions</h2>
      </div>
      <div className={styles.container}>
        {/* Left: Past Highlights (step scroll) */}
        <div className={styles.pastEventsCol}>
          <h3 className={styles.heading}>Past Highlights</h3>
          <div
            className={styles.scrollerWrapper}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            ref={wrapperRef}
            style={{ height: cardHeight.current ? cardHeight.current * 2 : undefined }}
          >
            <div
              className={styles.scroller}
              style={{
                transform: getTranslate(),
                transition: "transform 0.5s cubic-bezier(.4,2,.6,1)",
              }}
            >
              {/* Duplicate for infinite loop */}
              {[...events.pastEvents, ...events.pastEvents].map((event, idx) => (
                <div className={styles.eventCard} key={event.id || idx}>
                  <div className={styles.eventDate}>{event.date}</div>
                  <div className={styles.eventTitle}>{event.title}</div>
                  <div className={styles.eventDesc}>{event.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Right: Upcoming Sessions (static) */}
        <div className={styles.upcomingEventsCol}>
          <h3 className={styles.heading}>Upcoming Sessions</h3>
          <div className={styles.upcomingList}>
            {events.upcomingEvents.map((event) => (
              <div className={styles.eventCard} key={event.id}>
                <div className={styles.eventDate}>{event.date}</div>
                <div className={styles.eventTitle}>{event.title}</div>
                <div className={styles.eventLocation}>{event.location}</div>
                <div className={styles.eventDesc}>{event.description}</div>
                <button className={styles.detailsBtn}>View Details</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
