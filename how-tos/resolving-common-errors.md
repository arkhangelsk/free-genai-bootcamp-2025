# CORS (Cross-Origin Resource Sharing) issue

## Error
```
Access to fetch at 'http://localhost:5000/words?page=1&sort_by=kanji&order=asc' from origin 'http://localhost:5173' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource. If an opaque response serves your needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled.
```
<img width="1494" alt="image" src="https://github.com/user-attachments/assets/a481881b-873a-4392-89be-b9f4e3493117" />

## Reason
This happens when you're trying to make a request from one origin (http://localhost:5173) to another (http://localhost:5000), but the server on localhost:5000 is not configured to allow requests from localhost:5173.

## Solution
1. Change the API base URL in your api.ts file to use the proxy:

```ts
// Change this line
const API_BASE_URL = '/api';  // Instead of 'http://localhost:5000'
```

After updating the API_BASE_URL, the CORS error was resolved; however, the console began displaying a 403 error. To fix this, the Vite proxy configuration needed to be updated to target `http://127.0.0.1:5000` instead of `http://localhost:5000`.

<img width="739" alt="image" src="https://github.com/user-attachments/assets/68249056-2dc8-4e8c-9c13-2a4ef3ee24ff" />

2. Update your existing Vite proxy configuration:
```ts
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
```
This should now work correctly with the updated proxy configuration. The frontend will make requests to /api/words, which Vite will proxy to http://127.0.0.1:5000/words

### Why replacing http://localhost:5000 by http://127.0.0.1:5000/ resolved the 403 Error?

The difference between `localhost` and `127.0.0.1` is related to how hosts are resolved and how your development environment is configured. While they typically point to the same thing (your local machine), there can be subtle differences in how they're handled:

1. DNS Resolution: `localhost` needs to be resolved through DNS or the `hosts` file, while `127.0.0.1` is a direct IP address
2. IPv6 considerations: localhost might resolve to IPv6 ::1 first on some systems
3. Network stack handling: Some systems might handle localhost and 127.0.0.1 differently

When using `127.0.0.1`, you're bypassing any potential DNS resolution issues and connecting directly to the loopback interface.

**Note**: Alternatively, by just updating the API base URL in the `api.ts` file to use the direct IP address `http://127.0.0.1:5000` instead of `http://localhost:5000` also resolved the issue. 

```ts
// Change this line
const API_BASE_URL = 'http://127.0.0.1:5000';  // Instead of 'http://localhost:5000'
```
