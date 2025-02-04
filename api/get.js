export default async function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { target0, target1, target2, target3 } = req.query;

    if (!target0 || !target1 || !target2 || !target3) {
      return res.status(400).json({ error: "Both target1 and target2 parameters are required" });
    }

    const apiUrl0 = `https://pico.geodan.nl/cgi-bin/qgis_mapserv.fcgi?DPI=120&map=/usr/lib/cgi-bin/projects/gebouw_woningtype.qgs&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&CRS=EPSG%3A28992&WIDTH=937&HEIGHT=842&LAYERS=gebouw&STYLES=&FORMAT=image%2Fjpeg&QUERY_LAYERS=gebouw&INFO_FORMAT=text/xml&I=611&J=469&FEATURE_COUNT=10&bbox=${target3}`;

    const fetchWithErrorHandling = async (url, options = {}) => {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
        return { error: "error" }; // Return an object with just "error" as the result
      }
    };

    const fetchXMLWithRetry = async (url, options = {}, retries = 2) => {
      for (let i = 0; i <= retries; i++) {
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return await response.text(); // Return raw XML
        } catch (error) {
          console.error(`Error fetching ${url}:`, error.message);
        }
      }
      return "<error>error</error>"; // Return XML formatted error
    };

    
    const [data0] = await Promise.all([
      fetchXMLWithRetry(apiUrl0, { headers: { 'Content-Type': 'application/json' } }),
    
    ]);

    const combinedData = {
      LOOKUP: data0,
     
    };

    res.status(200).json(combinedData);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
