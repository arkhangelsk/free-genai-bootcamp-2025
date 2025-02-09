# CORS (Cross-Origin Resource Sharing) issue

## Error
```
Access to fetch at 'http://localhost:5000/words?page=1&sort_by=kanji&order=asc' from origin 'http://localhost:5173' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource. If an opaque response serves your needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled.
```
## Reason
This happens when you're trying to make a request from one origin (http://localhost:5173) to another (http://localhost:5000), but the server on localhost:5000 is not configured to allow requests from localhost:5173.

## Solution
There are two ways to fix this:
1. Use the Configured Proxy (Recommended):
Change the API base URL in your api.ts file to use the proxy:
```ts
// Change this line
const API_BASE_URL = '/api';  // Instead of 'http://localhost:5000'
```
This will work with your existing Vite proxy configuration:
```ts
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
```
2. Alternative: Update Backend CORS Configuration:
If you prefer to keep the direct URL, you need to update your Flask CORS configuration to explicitly allow requests from your frontend domain. In your Flask app:
```ts
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE"],
            "allow_headers": ["Content-Type"]
        }
    })
    return app
```
It's recommended to use the first approach (proxy) because:
* It's more secure
* It avoids CORS issues
* It makes it easier to deploy later since you won't need to change URLs between environments
* The proxy approach will route all requests from /api/* to your Flask backend while keeping the frontend code environment-agnostic.
