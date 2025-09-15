import React, { useRef, useState, useEffect, useMemo } from "react";
import Globe from "react-globe.gl";
import Map, { Marker, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

const EVENTS = [
  { id: "denver", name: "Denver", lat: 39.7392, lng: -104.9903, type: "past" },
  { id: "sf", name: "San Francisco", lat: 37.7749, lng: -122.4194, type: "past" },
  { id: "ny", name: "New York", lat: 40.7128, lng: -74.0060, type: "past" },
  { id: "cannes", name: "Cannes", lat: 43.5528, lng: 7.0153, type: "past" },
  { id: "bangkok", name: "Bangkok", lat: 13.7563, lng: 100.5018, type: "past" },
  { id: "brussels", name: "Brussels", lat: 50.8503, lng: 4.3517, type: "past" },
  { id: "berlin", name: "Berlin", lat: 52.52, lng: 13.405, type: "past" },
  { id: "seoul", name: "Seoul", lat: 37.5665, lng: 126.9780, type: "upcoming" },
  { id: "buenos", name: "Buenos Aires", lat: -34.6118, lng: -58.3960, type: "upcoming" },
];

export default function EspressoWorldMap() {
  const globeRef = useRef(null);
  const [isFlat, setIsFlat] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/dark-v11");
  const [viewport, setViewport] = useState({
    latitude: 20,
    longitude: 0,
    zoom: 1.5,
    bearing: 0,
    pitch: 0,
  });

  // Inject CSS once
  useEffect(() => {
    if (document.getElementById("espresso-map-styles")) return;
    const style = document.createElement("style");
    style.id = "espresso-map-styles";
    style.innerHTML = `
      .espresso-marker {
        position: relative;
        width: 28px;
        height: 28px;
        transform: translate(-50%, -50%);
        cursor: pointer;
      }
      .pulse {
        position: absolute;
        left: 50%; top: 50%;
        transform: translate(-50%,-50%);
        width: 20px; height: 20px;
        border-radius: 999px;
        animation: pulseEffect 2.5s infinite;
        opacity: 0.7;
      }
      .core {
        position: absolute;
        left: 50%; top: 50%;
        transform: translate(-50%,-50%);
        width: 10px; height: 10px;
        border-radius: 50%;
        border: 2px solid #fff;
        z-index: 2;
      }
      .past .pulse { background: rgba(0,200,90,0.25); box-shadow: 0 0 40px rgba(0,200,90,0.8); }
      .past .core { background: #00c85a; }
      .upcoming .pulse { background: rgba(255,180,40,0.25); box-shadow: 0 0 40px rgba(255,180,40,0.9); }
      .upcoming .core { background: #ffb428; }

      @keyframes pulseEffect {
        0% { transform: translate(-50%,-50%) scale(0.7); opacity: 0.9; }
        70% { transform: translate(-50%,-50%) scale(2.8); opacity: 0; }
        100% { transform: translate(-50%,-50%) scale(3.2); opacity: 0; }
      }

      .label {
        position: absolute;
        top: 32px;
        left: 50%;
        transform: translateX(-50%);
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        text-shadow: 0 2px 6px rgba(0,0,0,0.7);
        pointer-events: none;
      }

      .espresso-legend {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 12px;
        background: rgba(30, 20, 15, 0.85);
        padding: 10px 14px;
        border-radius: 8px;
        color: #f5f5dc;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 4px 10px rgba(0,0,0,0.4);
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .legend-dot {
        width: 14px; height: 14px;
        border-radius: 50%;
      }
      .dot-past { background: #00c85a; }
      .dot-upcoming { background: #ffb428; }

      @media(max-width: 600px) {
        .espresso-legend {
          font-size: 12px;
          padding: 8px 10px;
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const makeMarker = (ev) => {
    const wrap = document.createElement("div");
    wrap.className = `espresso-marker ${ev.type}`;
    wrap.innerHTML = `<div class="pulse"></div><div class="core"></div><div class="label">${ev.name}</div>`;
    wrap.onclick = (e) => {
      e.stopPropagation();
      onEventClick(ev);
    };
    return wrap;
  };

  const htmlElementsData = useMemo(() => EVENTS.map((e) => ({ ...e })), []);

  const onEventClick = (ev) => {
    setSelectedEvent(ev);
    if (!isFlat && globeRef.current) {
      globeRef.current.pointOfView({ lat: ev.lat, lng: ev.lng, altitude: 0.6 }, 800);
    } else {
      setViewport((v) => ({ ...v, latitude: ev.lat, longitude: ev.lng, zoom: 12 }));
      if (MAPBOX_TOKEN) setMapStyle("mapbox://styles/mapbox/satellite-streets-v11");
    }
  };

  // globe autorotate
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.25;
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#000" }}>
      {/* Logo + Legend */}
      <div style={{ position: "absolute", left: 16, top: 16, zIndex: 100 }}>
        <img
          src="/espresso-logo.png"
          alt="Espresso Logo"
          style={{ width: 120, height: "auto", marginBottom: 8 }}
        />
        <div className="espresso-legend">
          <div className="legend-item">
            <div className="legend-dot dot-past" />
            <span>Past Events</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot dot-upcoming" />
            <span>Upcoming Events</span>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsFlat((v) => !v)}
        style={{
          position: "absolute", right: 16, top: 16, zIndex: 99,
          background: "linear-gradient(145deg, #3e2723, #6d4c41)", // espresso coffee tones
          color: "#f5f5dc", // cream
          border: "none",
          borderRadius: 20,
          padding: "10px 16px",
          fontWeight: 700,
          fontSize: "14px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          cursor: "pointer"
        }}
      >
        {isFlat ? "🌍 Globe View" : "🗺️ Flat View"}
      </button>

      {/* Globe or Flat */}
      {!isFlat ? (
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          htmlElementsData={htmlElementsData}
          htmlElement={(d) => makeMarker(d)}
        />
      ) : (
        <Map
          {...viewport}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapStyle}
          mapboxAccessToken={MAPBOX_TOKEN}
          projection={{ name: "mercator" }}
          onMove={(evt) => setViewport(evt.viewState)}
        >
          <NavigationControl position="bottom-right" />

          {EVENTS.map((ev) => (
            <Marker key={ev.id} latitude={ev.lat} longitude={ev.lng}>
              <div
                className={`espresso-marker ${ev.type}`}
                onClick={() => onEventClick(ev)}
              >
                <div className="pulse" />
                <div className="core" />
                <div className="label">{ev.name}</div>
              </div>
            </Marker>
          ))}
        </Map>
      )}
    </div>
  );
}
