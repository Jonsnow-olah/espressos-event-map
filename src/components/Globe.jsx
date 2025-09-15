import React, { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import Globe from "react-globe.gl";
import Map, { Marker, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import espressoLogo from "../assets/esp-logo.png";
import IBMPlexMonoRegular from "../assets/IBMPlexMono-Regular.ttf";
import IBMPlexMonoBold from "../assets/IBMPlexMono-Bold.ttf";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

const EVENTS = [
  { id: "denver", name: "Denver", lat: 39.7392, lng: -104.9903, type: "past", image: "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,background=white,quality=75,width=400,height=400/event-covers/h8/8e7df1e8-dc16-4e4e-a3e0-0c13aa7d45dc", link: "https://luma.com/o2446knk" },
  { id: "sf", name: "San Francisco", lat: 37.7749, lng: -122.4194, type: "past", image: "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,background=white,quality=75,width=400,height=400/event-covers/39/18e29d3f-b546-46a4-833e-172e52b2d425.png", link: "https://luma.com/ethereum-10y-sanfrancisco" },
  { id: "ny", name: "New York", lat: 40.7128, lng: -74.0060, type: "past", image: "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,background=white,quality=75,width=400,height=400/event-covers/4u/2ce66858-89cd-480d-a08f-0f9b2e2c9c91.webp", link: "https://luma.com/yb17pn9g" },
  { id: "cannes", name: "Cannes", lat: 43.5528, lng: 7.0153, type: "past", image: "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,background=white,quality=75,width=400,height=400/event-covers/p0/e248f54e-6b91-4979-ad33-2965034269d7.png", link: "https://luma.com/h0lmohx9" },
  { id: "bangkok", name: "Bangkok", lat: 13.7563, lng: 100.5018, type: "past", image: "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,background=white,quality=75,width=400,height=400/event-covers/04/27f64949-5365-40f3-8665-6bb70844c81d", link: "https://luma.com/sequencing_day" },
  { id: "brussels", name: "Brussels", lat: 50.8503, lng: 4.3517, type: "past", image: "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,background=white,quality=75,width=400,height=400/event-covers/fz/7a4f0d00-8988-40ce-9d08-897383981a33", link: "https://luma.com/ud8p6oww" },
  { id: "berlin", name: "Berlin", lat: 52.52, lng: 13.405, type: "past", image: "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,background=white,quality=75,width=400,height=400/event-covers/lg/66aa8a08-1c4d-4a2a-8ae4-1fac476afc42.png", link: "https://luma.com/u407uyxp" },
  { id: "seoul", name: "Seoul", lat: 37.5665, lng: 126.9780, type: "upcoming", image: "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,background=white,quality=75,width=400,height=400/event-covers/eb/d17054bd-4286-44c4-bd7a-e0d6c0826818.png", link: "https://luma.com/h9uxi7c1" },
  { id: "buenos", name: "Buenos Aires", lat: -34.6118, lng: -58.3960, type: "upcoming", image: "https://luma.com/user/usr-cAqsoa41hhkQxPs", link: "https://luma.com/buenosaires" },
];

export default function EspressoWorldMap() {
  const globeRef = useRef(null);
  const [isFlat, setIsFlat] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/satellite-streets-v11");
  const [viewport, setViewport] = useState({
    latitude: 20,
    longitude: 0,
    zoom: 1.5,
    bearing: 0,
    pitch: 0,
  });

  useEffect(() => {
  if (document.getElementById("espresso-map-styles")) return;
  const style = document.createElement("style");
  style.id = "espresso-map-styles";
  style.innerHTML = `
    @font-face { font-family: 'IBMPlexMono'; src: url(${IBMPlexMonoRegular}) format('truetype'); font-weight: 400; font-style: normal; }
    @font-face { font-family: 'IBMPlexMono'; src: url(${IBMPlexMonoBold}) format('truetype'); font-weight: 700; font-style: normal; }

    .globe-container { position: relative; width: 100%; height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(#000 0%, #050505 100%); overflow: hidden; }
    canvas { width: 100% !important; height: 100% !important; display: block; }

    .espresso-marker { position: relative; width: 28px; height: 28px; transform: translate(-50%, -50%); cursor: pointer; }
    .pulse { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 20px; height: 20px; border-radius: 999px; animation: pulseEffect 2.5s infinite; }
    .core { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 10px; height: 10px; border-radius: 50%; border: 2px solid #fff; z-index: 2; }

    .past .pulse { background: rgba(69,31,23,0.25); box-shadow: 0 0 25px rgba(69,31,23,0.8); }
    .past .core { background: #451F17; }
    .upcoming .pulse { background: rgba(222,158,103,0.25); box-shadow: 0 0 25px rgba(222,158,103,0.8); }
    .upcoming .core { background: #DE9E67; }

    @keyframes pulseEffect { 0% { transform: translate(-50%,-50%) scale(0.7); opacity: 0.9; } 70% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; } 100% { transform: translate(-50%,-50%) scale(3); opacity: 0; } }

    .label { position: absolute; top: 32px; left: 50%; transform: translateX(-50%); color: #fff; font-size: 13px; font-weight: 700; font-family: 'IBMPlexMono', monospace; text-shadow: 0 2px 6px rgba(0,0,0,0.7); pointer-events: none; }

    .legend-tags { display: flex; flex-direction: column; gap: 10px; position: absolute; left: 16px; top: 50%; transform: translateY(-50%); z-index: 100; font-family: 'IBMPlexMono', monospace; font-weight: 700; }
    .tag { padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 700; font-family: 'IBMPlexMono', monospace; cursor: pointer; transition: background-color 0.2s ease; color: #fff; box-shadow: 0 3px 6px rgba(0,0,0,0.3); }
    .tag-past { background: #451F17; }
    .tag-upcoming { background: #DE9E67; }
    .tag-upcoming:hover { background-color: #e3af7b; }

    .view-toggle { display: flex; gap: 8px; position: absolute; top: 16px; right: 16px; z-index: 200; }
    .toggle-btn { display: flex; align-items: center; justify-content: center; background: #fff; color: #b67237; border-radius: 999px; padding: 10px 16px; font-size: 16px; font-weight: 700; font-family: 'IBMPlexMono', monospace; cursor: pointer; border: none; outline: none; transition: background-color .2s; height: 40px; }
    .toggle-btn:hover { background: #f2f2f2; }

    /* Event overlay styling */
    .event-overlay { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 90%; max-width: 600px; background: rgba(255, 245, 235, 0.2); color: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 6px 20px rgba(0,0,0,0.4); z-index: 300; font-family: 'IBMPlexMono', monospace; }
    .event-overlay img { width: 100%; border-radius: 8px; margin-bottom: 12px; }
    .event-overlay h2 { font-weight: 700; font-size: 20px; margin-bottom: 12px; }
    .event-overlay .buttons { display: flex; flex-direction: column; gap: 10px; }
    .event-overlay button { font-family: 'IBMPlexMono', monospace; font-weight: 700; font-size: 14px; padding: 10px 16px; border-radius: 8px; cursor: pointer; border: none; }
    .event-overlay .primary { background: #451F17; color: #fff; }
    .event-overlay .secondary { background: #DE9E67; color: #fff; }
    .event-overlay .close { position: absolute; top: 8px; right: 8px; background: transparent; border: none; color: #fff; font-size: 24px; cursor: pointer; }

    @media(max-width: 1024px) {
  .event-overlay { bottom: 10%; } /* moves it slightly up from bottom */
  .event-overlay { margin-bottom: 40px; }
  .legend-tags { gap: 12px; bottom: 65px; }
}

@media(max-width: 768px) {
  .event-overlay { bottom: 5%; } /* further down-middle on smaller devices */
  .event-overlay  { margin-bottom: 60px; }
  .legend-tags { gap: 12px; bottom: 65px; }
}

@media(max-width: 480px) {
  .event-overlay { bottom: 2%; } /* down-middle on small phones */
  .event-overlay  { margin-bottom: 80px; }
  .legend-tags { gap: 12px; bottom: 65px; }
}

  `;
  document.head.appendChild(style);
}, []);



  const htmlElementsData = useMemo(() => EVENTS.map((e) => ({ ...e })), []);

  

useEffect(() => {
  if (!globeRef.current) return;

  const globeObj = globeRef.current;
  const scene = globeObj.scene();
  const controls = globeObj.controls();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.25;


  scene.background = new THREE.Color(0x0d1b3c); // deep stary blue

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
  directionalLight.position.set(100, 100, 100);
  scene.add(ambientLight, directionalLight);

  // Globe glow
  const globeMesh = globeObj.globe();
  const glowGeometry = new THREE.SphereGeometry(1.02, 64, 64);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x111144,
    transparent: true,
    opacity: 0.4,
  });
  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
  globeMesh.add(glowMesh);

  // Starfield
  const starCount = 3000;
  const starVertices = [];
  const starSizes = [];
  for (let i = 0; i < starCount; i++) {
    const x = (Math.random() - 0.5) * 4000;
    const y = (Math.random() - 0.5) * 4000;
    const z = (Math.random() - 0.5) * 4000;
    starVertices.push(x, y, z);
    starSizes.push(Math.random() * 0.4 + 0.1);
  }

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starVertices, 3));
  starGeometry.setAttribute("size", new THREE.Float32BufferAttribute(starSizes, 1));

  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.3,
    transparent: true,
    opacity: 0.8,
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // Animate twinkling
  globeObj.onRender(() => {
    starMaterial.opacity = 0.6 + Math.random() * 0.4;
  });
}, []);





  const handleEventClick = (ev) => {
    setSelectedEvent(ev);
    if (!isFlat && globeRef.current) {
      globeRef.current.pointOfView({ lat: ev.lat, lng: ev.lng, altitude: 0.6 }, 800);
    } else {
      setViewport((v) => ({ ...v, latitude: ev.lat, longitude: ev.lng, zoom: 12 }));
      if (MAPBOX_TOKEN) setMapStyle("mapbox://styles/mapbox/satellite-streets-v11");
    }
  };

  const handleNextEvent = () => {
    if (!selectedEvent) return;
    const filtered = EVENTS.filter((e) => e.type === selectedEvent.type);
    const index = filtered.findIndex((e) => e.id === selectedEvent.id);
    const next = filtered[index + 1];
    if (next) handleEventClick(next);
    else {
      const newType = selectedEvent.type === "past" ? "upcoming" : "past";
      const first = EVENTS.find((e) => e.type === newType);
      if (first) handleEventClick(first);
    }
  };

  const handleJoinEvent = () => {
    if (!selectedEvent || !selectedEvent.link) return;
    window.open(selectedEvent.link, "_blank");
  };

  const makeMarker = (ev) => {
    const wrap = document.createElement("div");
    wrap.className = `espresso-marker ${ev.type}`;
    wrap.innerHTML = `<div class="pulse"></div><div class="core"></div><div class="label">${ev.name}</div>`;
    wrap.onclick = (e) => {
      e.stopPropagation();
      handleEventClick(ev);
    };
    return wrap;
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 16, top: 16, zIndex: 100 }}>
        <img src={espressoLogo} alt="Espresso Logo" style={{ width: 140 }} />
      </div>

      <div className="legend-tags">
        <div className="tag tag-past" onClick={() => handleEventClick(EVENTS.find(e => e.type === "past"))}>Past Events</div>
        <div className="tag tag-upcoming" onClick={() => handleEventClick(EVENTS.find(e => e.type === "upcoming"))}>Upcoming Events</div>
      </div>

      <div className="view-toggle">
        <button className="toggle-btn" onClick={() => setIsFlat(v => !v)}>
          {isFlat ? "🌍 Globe View" : "🗺️ Flat View"}
        </button>
      </div>

      {!isFlat ? (
        <div className="globe-container">
          <Globe
  ref={globeRef}
  globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
  htmlElementsData={htmlElementsData}
  htmlElement={(d) => makeMarker(d)}
  onGlobeReady={(globe) => {
    // Auto rotate
    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.25;

    
    if (globe.scene().getObjectByName("stars")) {
      globe.scene().remove(globe.scene().getObjectByName("stars"));
    }

    // twinkling stars
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 5000;
    const starVertices = [];
    for (let i = 0; i < starCount; i++) {
      const radius = 1500 + Math.random() * 1000; // Far outside the globe
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      starVertices.push(x, y, z);
    }
    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starVertices, 3)
    );
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    stars.name = "stars";
    globe.scene().add(stars);
  }}
/>

        </div>
      ) : (
        <Map
          {...viewport}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          mapStyle={mapStyle}
          mapboxAccessToken={MAPBOX_TOKEN}
          projection={{ name: "mercator" }}
          onMove={(evt) => setViewport(evt.viewState)}
        >
          <NavigationControl position="bottom-right" />
          {EVENTS.map((ev) => (
            <Marker key={ev.id} latitude={ev.lat} longitude={ev.lng}>
              <div className={`espresso-marker ${ev.type}`} onClick={() => handleEventClick(ev)}>
                <div className="pulse" />
                <div className="core" />
                <div className="label">{ev.name}</div>
              </div>
            </Marker>
          ))}
        </Map>
      )}

      {selectedEvent && (
        <div className="event-overlay">
          <button className="close" onClick={() => setSelectedEvent(null)}>×</button>
          <img src={selectedEvent.image || "https://via.placeholder.com/400x200"} alt={selectedEvent.name} />
          <h2>{selectedEvent.name}</h2>
          <div className="buttons">
            <button className="primary" onClick={handleJoinEvent}>
              {selectedEvent.type === "past" ? "See Event Details" : "Join Event"} ↑
            </button>
            <button className="secondary" onClick={handleNextEvent}>
              See Next Event →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
