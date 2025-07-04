# Database Tool

Database testing tool for MySQL operations.

## Usage

```typescript
const tool = new DatabaseTool(config);

const result = await tool.execute({
  query: "SELECT * FROM users WHERE id = ?",
  values: [1]
});
```

## Configuration

- `connection`: Database connection parameters
- `queries`: Common queries used by the tool
