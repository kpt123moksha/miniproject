# Service-area GeoJSON

The `service-areas.geojson` FeatureCollection includes three OpenStreetMap administrative boundaries:
- Mangaluru taluk (`relation/3804915`, `admin_level=6`, LGD subdistrict `5561`).
- Bantwal taluk (`relation/3805146`, `admin_level=6`, LGD subdistrict `5562`).
- Udupi taluku (`relation/4236158`, `admin_level=6`, LGD subdistrict `5523`).

These boundaries are broader than their respective municipal limits. The project uses these taluks as its service areas; backend search and complaint location checks accept reports inside the corresponding boundary. The source geometries are from [OpenStreetMap relation 3805146](https://www.openstreetmap.org/relation/3805146) and [OpenStreetMap relation 4236158](https://www.openstreetmap.org/relation/4236158), with ODbL attribution.

If the intended service area changes to city-only coverage, replace the data with verified municipal-limit FeatureCollections from the relevant local bodies or an authoritative Karnataka government GIS source. Do not relabel taluk polygons as municipal boundaries. Each feature must have `properties.city` set to its corresponding supported service area and a Polygon or MultiPolygon in WGS84 longitude/latitude order. The backend resolves `SERVICE_AREAS_GEOJSON=./data/service-areas.geojson` relative to the backend directory.