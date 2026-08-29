# 前端編譯規範

`scan` 與 `print` 都是純前端靜態網頁，開發環境只需要安裝 Podman，
不要求安裝 Node.js / npm。

## 編譯環境

專案根目錄提供：

```text
Containerfile.frontend
frontend.sh
frontend_dev.sh
frontend_build.sh
```

## 開發

```bash
./frontend_dev.sh
```

`frontend_dev.sh` 會自動建立 Podman 編譯環境、安裝 `scan` 與 `print`
的 npm 依賴，並同時啟動兩個 Vite 開發伺服器。程式碼變更會持續
watch 並由 Vite 重新編譯。

開發預設網址：

- `scan`：`http://localhost:5173`
- `print`：`http://localhost:5174`

## 正式編譯

```bash
./frontend_build.sh
```

`frontend_build.sh` 會自動建立 Podman 編譯環境、安裝兩個 App 的 npm
依賴，並以 Vite production mode 編譯及壓縮正式靜態資源。

正式輸出目錄：

- `scan/dist/`
- `print/dist/`

上述目錄可直接部署成靜態網站，不需要 Node.js runtime。
