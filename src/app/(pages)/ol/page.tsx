"use client";

import { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Feature } from "ol";
import { Point } from "ol/geom";
import { Style, Icon, Stroke } from "ol/style";
import { fromLonLat, transform } from "ol/proj";
import { LineString } from "ol/geom";

export default function OpenLayerMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
  const [endPoint, setEndPoint] = useState<[number, number] | null>(null);
  const startPointRef = useRef<[number, number] | null>(null);
  const endPointRef = useRef<[number, number] | null>(null);
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const vectorSource = useRef(new VectorSource());
  const vectorLayer = useRef(
    new VectorLayer({
      source: vectorSource.current,
      style: new Style({
        image: new Icon({
          src: "https://openlayers.org/en/latest/examples/data/icon.png",
          scale: 0.5,
        }),
      }),
    })
  );

  const calculateRoute = async (
    start: [number, number],
    end: [number, number]
  ) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      if (data.routes && data.routes[0]) {
        const coordinates = data.routes[0].geometry.coordinates;
        setRoute(coordinates);

        // Add route to map
        const routeFeature = new Feature({
          geometry: new LineString(
            coordinates.map((coord: [number, number]) => fromLonLat(coord))
          ),
        });

        //  vectorSource.current.clear();

        // Set a style for the route line
        routeFeature.setStyle(
          new Style({
            stroke: new Stroke({
              color: "#0066ff",
              width: 4,
            }),
          })
        );
        vectorSource.current.addFeature(routeFeature);
        // Get the extent of the route feature and fit the map view to it with animation
        const extent = routeFeature.getGeometry()?.getExtent();
        if (extent) {
          map?.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            duration: 1000,
          });
        }

        console.log(routeFeature);
      }
    } catch (error) {
      console.error("Error calculating route:", error);
    }
  };

  useEffect(() => {
    startPointRef.current = startPoint;
    endPointRef.current = endPoint;
  }, [startPoint, endPoint]);

  useEffect(() => {
    if (!mapRef.current) return;

    const mapInstance = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer.current,
      ],
      view: new View({
        center: fromLonLat([12.4964, 41.9028]), // Rome coordinates
        zoom: 15,
      }),
    });

    // Add click interaction
    mapInstance.on("click", (event) => {
      const coordinate = mapInstance.getEventCoordinate(
        event.originalEvent as MouseEvent
      );
      const lonLat = transform(
        mapInstance.getCoordinateFromPixel(event.pixel as [number, number]),
        "EPSG:3857",
        "EPSG:4326"
      ) as [number, number];
      if (!startPointRef.current) {
        setStartPoint(lonLat);
        const startFeature = new Feature({
          geometry: new Point(fromLonLat(lonLat)),
        });
        vectorSource.current.addFeature(startFeature);
      } else if (!endPointRef.current) {
        setEndPoint(lonLat);
        const endFeature = new Feature({
          geometry: new Point(fromLonLat(lonLat)),
        });
        vectorSource.current.addFeature(endFeature);
        // calculateRoute(startPointRef.current, lonLat);
      } /*  else {
        // Reset points
        setStartPoint(null);
        setEndPoint(null);
        setRoute(null);
        vectorSource.current.clear();
      } */
    });

    setMap(mapInstance);

    return () => {
      mapInstance.setTarget(undefined);
    };
  }, []);

  useEffect(() => {
    if (!map) return;

    console.log(map);
  }, [map]);

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <div ref={mapRef} className="w-2/3 h-2/3" />
      <div className="absolute top-4 left-4 bg-white text-black p-4 rounded-lg shadow-lg max-w-50">
        <h2 className="text-lg font-bold mb-2">Routing Instructions</h2>
        <p>1. Click to set start point</p>
        <p>2. Click to set end point</p>
        <p>3. Click on calculate route button to calculate route</p>
        <p>4. Click on reset button to reset the route</p>
      </div>
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => {
            if (startPoint && endPoint) {
              calculateRoute(startPoint, endPoint);
            }
          }}
          className=" bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg"
          //  disabled={!startPoint || !endPoint}
        >
          Calculate Route
        </button>
        <button
          onClick={() => {
            // Reset points
            setStartPoint(null);
            setEndPoint(null);
            setRoute(null);
            vectorSource.current.clear();
          }}
          className=" bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg"
          //  disabled={!startPoint || !endPoint}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
