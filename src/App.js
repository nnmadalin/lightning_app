import logo from './logo.svg';
import { 
  MapContainer,
  Marker,
  Popup,
  TileLayer, 
  Circle 
} from "react-leaflet";
import { Icon} from "leaflet";
import React, { useState, useEffect } from 'react';
import WebSocket from 'websocket';
import { FaGithub, FaInstagram, FaFacebook, FaSearch} from "react-icons/fa";



import './App.css';

function App() {

  const [location, setLocation] = useState([]);
  const [receivedData, setReceivedData] = useState([]);
  const iconStyle = {
    url: 'https://images.emojiterra.com/google/noto-emoji/unicode-15/color/svg/26a1.svg',
    scaledSize: { width: 25, height: 25 },
  };
  const position = [0, 0]; // [latitude, longitude]
  const zoomLevel = 3;
  const codingSpot = new Icon({
    iconUrl: "/bolt-lightning-solid.svg",
    iconSize: [15, 15],
  });
  const circleRadius = 500;
 

  useEffect(() => {
    NewWebSocket();
  }, []);

  function decode(i) {
    var n;
    var args = {};
    var data = i.split("");
    var name = data[0];
    var prefix = name;
    var param = [name];
    var x = 256;
    var o = x;
    i = 1;
    for (; i < data.length; i++) {
        n = data[i].charCodeAt(0);
        n = x > n ? data[i] : args[n] ? args[n] : prefix + name;
        param.push(n);
        name = n.charAt(0);
        args[o] = prefix + name;
        o++;
        prefix = n;
    }
    return param.join("");
  }
  

  let ws = null;
  async function NewWebSocket() {
    try {
        var wsServer = 'wss://ws1.blitzortung.org';
        console.log('connecting to server %s', wsServer)
        ws = new WebSocket.w3cwebsocket(wsServer);
        ws.onopen = () => {
          console.log('WebSocket connection opened');
          ws.send('{"a":111}');
        };
    
        ws.onmessage = async event => {
          try {
            var dataObj = event.data;
            var jsondecode = null;
            try {
              const response = await fetch('http://localhost:8000/process-api', {
                method: 'POST',
                body: dataObj
              });
        
              const responseData = await response.json();
              if (response.ok) {
                const newPoint = {lat: responseData.lat, lng: responseData.lon, time: new Date()};
                setLocation((prevPoints) => [...prevPoints, newPoint]);
              } 
            } catch (error) {
              console.log(error.message);
            }
          } catch (error) {
              console.log(error.message);
          }
        };
    
        ws.onclose = () => {
          console.log('WebSocket connection closed');
          NewWebSocket()
        };

        
    } catch (error) {
      console.log(error);
      NewWebSocket()
    }

};

  function calculateHaversineDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180);
    const dLon = (coord2.lng - coord1.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coord1.lat * (Math.PI / 180)) * Math.cos(coord2.lat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  const groupedPoints = [];

  location.forEach(point => {
    const existingGroup = groupedPoints.find(groupedPoint =>
      calculateHaversineDistance(point, groupedPoint) == 0
    );

    if (existingGroup) {
      existingGroup.count += 1;
    } else {
      groupedPoints.push({ ...point, count: 1});
    }
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentTime = new Date();
      const updatedMarkers = location.map(marker => {
        if (currentTime - marker.time >= 60000) {
          return null;
        }
        return marker;
      }).filter(Boolean);
      setLocation(updatedMarkers);
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="App">
      <div className='title'>
        <h1>Lightning detector</h1>
        <p><a href='https://www.blitzortung.org/'>https://www.blitzortung.org/</a></p>
        <h3>Neauna Madalin</h3>
        <div className='social'>
          <a href='https://github.com/nnmadalin' target={"_blank"}><FaGithub /></a>
          <a href='https://www.instagram.com/nnmadalin/' target={"_blank"}><FaInstagram /></a>
          <a href='https://www.facebook.com/madalin.neauna' target={"_blank"}><FaFacebook /></a>
        </div>
      </div>
      <MapContainer 
        center={position} 
        zoom={zoomLevel} 
        scrollWheelZoom={true}
      >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />

      {groupedPoints.map((groupedPoint, index) => (
        <React.Fragment key={index}>
          <Circle center={[groupedPoint.lat, groupedPoint.lng]} radius={circleRadius} />
          <Marker position={[groupedPoint.lat, groupedPoint.lng]} icon={codingSpot}>
            <Popup>{`${groupedPoint.count} lightning in this area ⚡`} <br/> {`latitude: ` + groupedPoint.lat}  <br/> {`longitude: ` + groupedPoint.lng} <br/> {`Date: ` + groupedPoint.time}</Popup>
          </Marker>
        </React.Fragment>
      ))}
    </MapContainer>
    </div>
  );
}

export default App;
