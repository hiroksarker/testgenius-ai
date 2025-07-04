# API Tool

API testing tool for making HTTP requests.

## Usage

```typescript
const tool = new ApiTool(config);
const result = await tool.execute({
  method: 'POST',
  endpoint: '/users',
  data: { name: 'John' }
});
```

## Configuration

- `baseUrl`: Base URL for API requests
- `headers`: Default headers to include in requests
