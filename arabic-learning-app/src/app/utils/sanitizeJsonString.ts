export const sanitizeJsonString = (jsonStr: string): string => {
  try {
    // First attempt: Basic sanitization
    let sanitized = jsonStr
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
      .replace(/\n/g, "\\n") // Properly escape newlines
      .replace(/\r/g, "\\r") // Properly escape carriage returns
      .replace(/\t/g, "\\t") // Properly escape tabs
      .replace(/\\(?!["\\/bfnrt])/g, "\\\\"); // Escape backslashes not followed by valid escape chars

    // Fix trailing commas in arrays
    sanitized = sanitized.replace(/,\s*]/g, "]");

    // Fix trailing commas in objects
    sanitized = sanitized.replace(/,\s*}/g, "}");

    // Fix missing commas between array elements (addresses the specific error)
    sanitized = sanitized.replace(/][ \t\r\n]*\[/g, "],[");

    // Fix missing commas between string elements
    sanitized = sanitized.replace(/"[ \t\r\n]*"/g, '","');

    // Check if the JSON is valid after sanitization
    JSON.parse(sanitized);
    return sanitized;
  } catch (parseError) {
    console.warn(
      "Basic sanitization failed, attempting more aggressive repair:",
      parseError
    );

    // Second attempt: More aggressive cleaning and repair
    try {
      // Extract what looks like a JSON object
      const jsonMatch = jsonStr.match(/({[\s\S]*})/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      // Ensure the string starts and ends with valid JSON brackets
      if (!jsonStr.trim().startsWith("{")) jsonStr = "{" + jsonStr;
      if (!jsonStr.trim().endsWith("}")) jsonStr = jsonStr + "}";

      // Replace unescaped quotes in strings
      let inString = false;
      let result = "";

      for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr[i];

        if (char === '"' && (i === 0 || jsonStr[i - 1] !== "\\")) {
          inString = !inString;
        }

        // Handle array syntax problems
        if (inString && char === "]") {
          result += "\\]"; // Escape closing brackets inside strings
        } else if (inString && char === "[") {
          result += "\\["; // Escape opening brackets inside strings
        } else {
          result += char;
        }
      }

      // Check if we closed all strings properly
      let fixedJson = result;
      if (inString) {
        fixedJson += '"'; // Close any unclosed string
      }

      // Final fixes for common issues
      fixedJson = fixedJson
        // Fix double commas
        .replace(/,,/g, ",")
        // Fix space between property name and colon
        .replace(/"([^"]+)"[ \t]+:/g, '"$1":')
        // Fix missing quotes around property names
        .replace(/([{,]\s*)([a-zA-Z0-9_$]+)(\s*:)/g, '$1"$2"$3');

      // Validate the final result
      JSON.parse(fixedJson);
      return fixedJson;
    } catch (finalError) {
      // If all repair attempts fail, throw an error with details
      console.error("All JSON repair attempts failed:", finalError);
      throw new Error("Failed to repair malformed JSON");
    }
  }
};
