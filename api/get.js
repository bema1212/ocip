import { DOMParser } from "xmldom";

export default async function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    const { target0, target1, target2, target3 } = req.query;
    if (!target0 || !target1 || !target2 || !target3) {
      return res.status(400).send("Missing required parameters");
    }

    const apiUrl0 = `https://pico.geodan.nl/cgi-bin/qgis_mapserv.fcgi?DPI=120&map=/usr/lib/cgi-bin/projects/gebouw_woningtype.qgs&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&CRS=EPSG%3A28992&WIDTH=937&HEIGHT=842&LAYERS=gebouw&STYLES=&FORMAT=image%2Fjpeg&QUERY_LAYERS=gebouw&INFO_FORMAT=text/xml&I=611&J=469&FEATURE_COUNT=10&bbox=${target3}`;

    const fetchXMLWithRetry = async (url, retries = 2) => {
      for (let i = 0; i <= retries; i++) {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          return await response.text(); // Get raw XML
        } catch (error) {
          console.error(`Error fetching ${url}:`, error.message);
        }
      }
      return "<error>Failed to fetch XML data</error>";
    };

    const xmlData = await fetchXMLWithRetry(apiUrl0);

    // Debug: Check if XML is received properly
    console.log("Fetched XML:", xmlData);

    // Parse XML
    const doc = new DOMParser().parseFromString(xmlData, "text/xml");

    if (!doc) {
      throw new Error("XML Parsing failed");
    }

    // Extract `gebouw_id`
    const attributes = doc.getElementsByTagName("Attribute");
    let gebouwId = "Not found";

    for (let i = 0; i < attributes.length; i++) {
      if (attributes[i].getAttribute("name") === "gebouw_id") {
        gebouwId = attributes[i].getAttribute("value");
        break;
      }
    }

    res.setHeader("Content-Type", "text/plain");
    res.status(200).send(gebouwId);
  } catch (error) {
    console.error("Error in handler:", error);
    res.setHeader("Content-Type", "text/plain");
    res.status(500).send("Internal Server Error");
  }
}
