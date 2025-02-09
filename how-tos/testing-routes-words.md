# Testing the /words Route:

## Important Specifications

### Pagination
- 50 words per page
- Page parameter must be positive

### Sorting Options
- Default: `sort_by=kanji&order=asc`
- Available sort fields:
  - kanji
  - romaji
  - english
  - correct_count
  - wrong_count
- Order options:
  - asc (ascending)
  - desc (descending)

## Testing Checklist

✓ Basic endpoint functionality   
✓ Pagination works correctly   
✓ Sorting applies properly   
✓ Error handling works as expected   
✓ Response matches interface specification   
✓ Default values are applied when parameters are missing   

## What to Test?

1. Test with various page numbers to verify pagination
2. Try all sorting combinations
3. Verify response format matches interface
4. Test error scenarios
5. Check default behavior when parameters are omitted

## How to Test?

### 1. Terminal Testing with cURL

```bash
# Basic request
curl http://127.0.0.1:5000/words

# With query parameters
curl "http://127.0.0.1:5000/words?page=2"
curl "http://127.0.0.1:5000/words?sort_by=english&order=desc"
```

<img width="793" alt="image" src="https://github.com/user-attachments/assets/bab8ab8b-2a81-4708-aed9-ed6ab731c596" />


### 2. Browser Testing

Navigate directly to:
- Basic endpoint: `http://127.0.0.1:5000/words`
- With pagination: `http://127.0.0.1:5000/words?page=2`
- With sorting: `http://127.0.0.1:5000/words?sort_by=english&order=desc`

<img width="1278" alt="image" src="https://github.com/user-attachments/assets/3315218b-67c4-4ada-9828-b32948190d03" />

### 3. Postman Testing

#### Basic Setup
1. Create new GET request
2. Enter URL: `http://localhost:5000/words`

<img width="1112" alt="image" src="https://github.com/user-attachments/assets/b65031ab-6c91-4833-8b65-1bba4b31988b" />

#### Query Parameters
Add these parameters in the "Params" tab:

| Key      | Value Options                                            |
|----------|--------------------------------------------------------|
| page     | Any positive number (e.g., 1, 2, 3)                     |
| sort_by  | kanji, romaji, english, correct_count, wrong_count      |
| order    | asc, desc                                               |

<img width="1117" alt="image" src="https://github.com/user-attachments/assets/4a6dd5d2-94c8-427d-a37d-4a247cb29d4e" />

