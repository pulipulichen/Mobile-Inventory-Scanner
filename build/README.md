# 前端編譯規範

`scan` 與 `print` 都是純前端靜態網頁，開發環境只需要安裝 Podman，
不要求安裝 Node.js / npm。

## 編譯環境

專案根目錄提供：

```text
Containerfile.frontend
frontend.sh
```

## 統一命令

```bash
./frontend.sh image
./frontend.sh install <scan|print>
./frontend.sh dev <scan|print>
./frontend.sh build <scan|print>
```

開發預設網址：

- `scan`：`http://localhost:5173`
- `print`：`http://localhost:5174`

正式輸出目錄：

- `scan/dist/`
- `print/dist/`

上述目錄可直接部署成靜態網站，不需要 Node.js runtime。
