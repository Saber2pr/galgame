# galgame

data format:

```ts
interface Data {
  paras: {
    [page: string]: Array<{ lines: string[], bg: string }>
  }
  selects: {
    [page: string]: {
      [title: string]: string
    }
  }
}
```
