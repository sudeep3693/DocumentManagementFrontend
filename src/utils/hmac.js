/**
 * Utility to generate HMAC SHA-256 identical to backend logic
 */

const getSecretKey = () => {
  return import.meta.env.VITE_HMAC_SECRET_KEY || 'your-secret-key-change-in-production';
};

/**
 * Derives the hex string representation of SHA-256 hash
 * @param {string} data 
 * @returns {Promise<string>}
 */
async function hashSHA256(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // Format as lowercase hex
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates the Base64 HMAC Signature for the request using identical Java formatting
 * @param {Object|string} payload The exact `config.data` being sent via Axios
 * @param {string} method HTTP Method
 * @param {string} fullUrl The URL path plus serialized alphabetically ordered query params
 * @returns {Promise<string>} null if skipped or failed
 */
export async function generateHmac(payload, method, fullUrl) {
  try {
    const secretKey = getSecretKey();

    // Axios sends `config.data` as object or string. We need to reflect how it'll hit Java endpoint as a String
    let requestBodyString = "";
    if (payload !== undefined && payload !== null) {
      requestBodyString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    }

    let flatJson = "";
    if (requestBodyString.trim() !== '') {
      flatJson = requestBodyString.trim();
    } else {
      // Fallback replicating Java's `mapper.writeValueAsString("")` mapping on empty bodies
      flatJson = '""';
    }

    // Backend canonicalData: method + "|" + fullUrl + "|" + flatJson
    const canonicalData = `${method.toUpperCase()}|${fullUrl}|${flatJson}`;
    const rawSignature = canonicalData + secretKey;

    // Hash and transform
    const sha256Signature = await hashSHA256(rawSignature);
    const upperHex = sha256Signature.toUpperCase();

    // Base64 encode the string literal
    return btoa(upperHex);
  } catch (error) {
    console.error("Error generating HMAC:", error);
    return null;
  }
}

