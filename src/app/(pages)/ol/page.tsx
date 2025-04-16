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

  const [waypoints, setWaypoints] = useState<[number, number][]>([]);
  const waypointsRef = useRef<[number, number][]>([]);
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const routeRef = useRef<[number, number][] | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
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

  const calculateRoute = async (waypoints: [number, number][]) => {
    try {
      const waypointsString = waypoints
        .map((point) => `${point[0]},${point[1]}`)
        .join(";");

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${waypointsString}?overview=full&alternatives=3&steps=true&geometries=geojson`
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

        const alternativeCoords = data.routes?.[1]?.geometry?.coordinates;
        const alternativeRouteFeatures = alternativeCoords
          ? new Feature({
              geometry: new LineString(
                alternativeCoords?.map((coord: [number, number]) =>
                  fromLonLat(coord)
                )
              ),
            })
          : undefined;

        if (!!alternativeRouteFeatures) {
          alternativeRouteFeatures.setStyle(
            new Style({
              stroke: new Stroke({
                color: "#f4f4f4",
                width: 4,
              }),
            })
          );
          vectorSource.current.addFeature(alternativeRouteFeatures);
        }

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
    waypointsRef.current = waypoints;
    routeRef.current = route;
  }, [waypoints, route]);

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

      if (!!routeRef.current) {
        // Reset points
        setWaypoints([]);
        setRoute(null);
        vectorSource.current.clear();
      }

      const lonLat = transform(
        mapInstance.getCoordinateFromPixel(event.pixel as [number, number]),
        "EPSG:3857",
        "EPSG:4326"
      ) as [number, number];
      setWaypoints([...waypointsRef.current, lonLat]);
      const startFeature = new Feature({
        geometry: new Point(fromLonLat(lonLat)),
      });
      vectorSource.current.addFeature(startFeature);
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
      {!showInstructions && (
        <button
          className="absolute top-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg"
          onClick={() => {
            setShowInstructions(!showInstructions);
          }}
        >
          Show Instructions
        </button>
      )}
      {showInstructions && (
        <div className="absolute top-4 left-4 bg-white text-black p-4 rounded-lg shadow-lg max-w-50">
          <button
            className="absolute top-2 right-2 text-2xl font-bold"
            onClick={() => {
              setShowInstructions(!showInstructions);
            }}
          >
            ✕
          </button>
          <h2 className="text-lg font-bold mb-2">Routing Instructions</h2>
          <p>1. Click to set start point</p>
          <p>2. Click to set end point</p>
          <p>3. Click on calculate route button to calculate route</p>
          <p>4. Click on reset button to reset the route</p>
        </div>
      )}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => {
            if (waypoints.length > 0) {
              calculateRoute(waypoints);
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
            setWaypoints([]);
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
