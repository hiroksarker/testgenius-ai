# UI Tool

UI interaction tool for WebDriverIO automation.

## Usage

```typescript
const tool = new UiTool(config);
tool.setBrowser(browser);

const result = await tool.execute({
  action: 'click',
  selector: '#login-btn'
});
```

## Actions

- `click`: Click an element
- `type`: Type text into an element
- `getText`: Get text from an element

## Configuration

- `selectors`: Common selectors used by the tool
- `timeouts`: Timeout configurations
