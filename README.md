# Comfland - Imperfect Throw Pillow Landing Page

单产品家纺 A/B 测试落地页，纯静态 HTML/CSS/JS，无构建步骤。桌面端为左图右文双栏，移动端自动切换为上下排列。访客打开页面时会立即写入一条记录，提交邮箱或离开页面时更新同一条记录，因此每个广告点击都会在 Google Sheets 里留档。

## 项目结构

```text
comfland-landing/
├── index.html
├── style.css
├── script.js
├── apps-script.gs
├── assets/
│   └── pillow.jpg
└── README.md
```

本地预览：直接双击 `index.html`，或运行 `python -m http.server` 后访问 `http://localhost:8000`。

## 自动收集的字段

| 字段 | 来源 | 说明 |
| --- | --- | --- |
| Visit ID | 页面自动生成 | 每次访问唯一，用于把打开、提交、离开三条信号合并成一行 |
| Email | 用户提交表单 | 未提交时为空 |
| Group | 落地链接参数 | 记录被试来自哪个广告 |
| Time On Page (s) | 页面计时 | 提交或离开时的停留秒数 |
| Device | 浏览器和设备信息 | `desktop`、`mobile` 或 `tablet` |
| Region | 浏览器时区 | 例如 `Asia/Shanghai` |
| Language | 浏览器语言 | 例如 `zh-CN` |
| Source | 页面自动 | `page_view`、`form_submit`、`page_leave`，用于核对数据来源 |

### 广告链接如何携带组别

在每个广告的落地链接末尾追加 `?group=广告标识`：

```text
https://vvivian2025wifi-creator.github.io/comfland-landing/?group=facebook-a
https://vvivian2025wifi-creator.github.io/comfland-landing/?group=google-b
```

也支持 `variant`、`ad`、`utm_campaign`、`utm_source`、`utm_medium`。没有带任何参数时记录为 `direct`。

打开页面时记录会立即写入（Email 为空），之后提交邮箱会更新同一行的 Email 和停留时间；未提交直接离开时，浏览器会尝试发送 `page_leave` 更新停留时间。即使离开信号没有发出，广告点击这一行仍然存在。

## 1. 商品图片

页面读取的是 `assets/pillow.jpg`。当前版本由 `pillow_0.png` 转换而来，原图保留在项目根目录。以后替换图片时，把新图保存为 `assets/pillow.jpg` 即可，无需修改任何代码。

## 2. Google Sheets 收集数据

数据链路：

```text
Landing Page
      ↓
Google Apps Script Web App
      ↓
Google Sheets
```

### 2.1 创建 Google Sheet

1. 打开 `https://sheets.new` 创建一个新表格，命名为 `Comfland Signups`。
2. 工作表会自动命名为 `Sheet1`。脚本会在需要时自动创建 `Emails` 表。

### 2.2 创建 Apps Script

1. 在 Google Sheets 中打开菜单：`扩展程序 > Apps Script`。
2. 删除默认代码，粘贴本项目里的 `apps-script.gs` 全部内容。
3. 项目名称改成 `Comfland Signups`，保存。
4. 在函数下拉框中选择 `setupSheet`，点击运行，按提示授权。运行后 `Emails` 表会自动生成 9 列表头：`Timestamp`、`Visit ID`、`Email`、`Group`、`Time On Page (s)`、`Device`、`Region`、`Language`、`Source`。

### 2.3 部署为 Web App

1. 点击右上角 `部署 > 新建部署`。
2. 类型选择 `Web 应用`。
3. 说明可以写 `Comfland signup endpoint`。
4. `执行身份` 选择 `我`。
5. `谁能访问` 选择 `任何人`。公开网页必须选择“任何人”，否则匿名访客无法写入。
6. 点击 `部署`，按提示完成授权。

### 2.4 获取 Web App URL

部署完成后会显示一个以 `/exec` 结尾的 URL，例如：

```text
https://script.google.com/macros/s/AKfycb.../exec
```

### 2.5 将 URL 填入 Landing Page

打开 `script.js`，把顶部变量替换成你自己的地址：

```javascript
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycb.../exec";
```

### 2.6 测试数据是否进入 Google Sheet

1. 打开页面，`Emails` 表应立刻出现一行，Email 为空，Source 为 `page_view`。
2. 输入邮箱，点击 `Submit`，页面显示 `Thank you. We'll keep you updated.`。
3. 回到 Google Sheet，确认同一行（相同 Visit ID）已出现邮箱、停留秒数和 Source `form_submit`。
4. 再打开一次页面后直接关掉，确认浏览器支持的场景下停留时间会被 `page_leave` 更新。

## 3. 部署到 GitHub Pages

### 3.1 创建 GitHub 仓库

在 GitHub 上新建一个仓库，例如 `comfland-landing`，选择 `Public`，先不要勾选 “Add a README”。

### 3.2 推送本项目

在项目目录打开终端执行：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/vvivian2025wifi-creator/comfland-landing.git
git push -u origin main
```

仓库名保持 `comfland-landing`，用户名已经填好。

### 3.3 开启 GitHub Pages

1. 打开仓库 `Settings > Pages`。
2. `Build and deployment` 的 `Source` 选择 `Deploy from a branch`。
3. `Branch` 选择 `main`，目录选择 `/ (root)`，点击 `Save`。
4. 等待 1-2 分钟，访问：

```text
https://vvivian2025wifi-creator.github.io/comfland-landing/
```

### 3.4 给广告链接添加组别参数

上线后，把每个广告的落地链接都带上 `?group=广告标识`，例如：

```text
https://vvivian2025wifi-creator.github.io/comfland-landing/?group=facebook-a
https://vvivian2025wifi-creator.github.io/comfland-landing/?group=instagram-b
```

项目中全部使用相对路径，图片、CSS、JavaScript 在子路径下都能正常加载。

## 4. 需要替换的变量

| 变量 | 位置 | 说明 |
| --- | --- | --- |
| `GOOGLE_SCRIPT_URL` | `script.js` | 必须替换为你的 Apps Script Web App URL |
| `GOOGLE_SHEET_ID` | `apps-script.gs` | 可选；脚本绑定在表格内时不用替换 |

## 5. 常见问题

**打开页面后 Google Sheet 没有新行**

- 确认 Apps Script 的访问权限是 `任何人`。
- 修改代码后需要重新部署：`部署 > 管理部署 > 编辑 > 版本 > 新建版本 > 部署`。
- 直接访问 `/exec` 地址，看到 JSON 响应说明部署正常。

**Group 显示 direct**

- 说明访问链接里没有 `group` 等参数，检查广告是否把带参数的 URL 发给了被试。

**Region 只有时区**

- 当前实现使用浏览器时区近似地区，不依赖外部 IP 接口。如果需要精确到国家或城市，需要额外接入 IP 定位 API。

**为什么打开页面就有一行空 Email 记录**

- 这是为了确保每个广告点击都有数据。如果不想记录未提交邮箱的访客，删除 `script.js` 顶部 `postRecord(buildPayload("", "page_view", 0)).catch(() => {});` 这一行即可。

## Google Apps Script 代码

`apps-script.gs` 内容如下，直接复制进 Apps Script 编辑器即可：

```javascript
/**
 * Comfland email signup endpoint.
 * Deploy this script as a Google Apps Script Web App.
 */

// Optional: paste your spreadsheet ID here.
// If you leave this as-is, the script uses the spreadsheet it is bound to.
const GOOGLE_SHEET_ID = "YOUR_GOOGLE_SHEET_ID";
const SHEET_NAME = "Emails";
const HEADERS = [
  "Timestamp",
  "Visit ID",
  "Email",
  "Group",
  "Time On Page (s)",
  "Device",
  "Region",
  "Language",
  "Source"
];

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const email = String(payload.email || "").trim().toLowerCase();

    if (email && !isValidEmail_(email)) {
      return jsonResponse_({ success: false, error: "INVALID_EMAIL" });
    }

    upsertVisit_({
      visitId: clean_(payload.visitId, ""),
      email: email,
      group: clean_(payload.group, "direct"),
      timeOnPage: toNumber_(payload.timeOnPage),
      deviceType: clean_(payload.deviceType, "unknown"),
      region: clean_(payload.region, "unknown"),
      language: clean_(payload.language, "unknown"),
      source: clean_(payload.source, "page_view")
    });

    return jsonResponse_({ success: true });
  } catch (error) {
    return jsonResponse_({ success: false, error: "SERVER_ERROR" });
  }
}

function doGet() {
  return jsonResponse_({
    success: true,
    message: "Comfland signup endpoint is running."
  });
}

// Creates the Emails sheet and header row when they do not exist yet.
function setupSheet() {
  const sheet = getSheet_();
  Logger.log("Ready. Sheet: " + sheet.getName());
}

function getSheet_() {
  const spreadsheet =
    GOOGLE_SHEET_ID && GOOGLE_SHEET_ID !== "YOUR_GOOGLE_SHEET_ID"
      ? SpreadsheetApp.openById(GOOGLE_SHEET_ID)
      : SpreadsheetApp.getActiveSpreadsheet();

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.setFrozenRows(1);
  }
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (current.join("|") !== HEADERS.join("|")) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function upsertVisit_(data) {
  const sheet = getSheet_();

  if (data.visitId) {
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][1]) === data.visitId) {
        const rowNumber = i + 1;
        const existingEmail = String(values[i][2] || "");
        const existingTime = toNumber_(values[i][4]);
        const nextEmail = data.email || existingEmail;
        const nextTime = Math.max(existingTime, data.timeOnPage);

        sheet.getRange(rowNumber, 3, 1, 7).setValues([
          [
            nextEmail,
            data.group,
            nextTime,
            data.deviceType,
            data.region,
            data.language,
            data.source
          ]
        ]);
        return;
      }
    }
  }

  sheet.appendRow([
    new Date(),
    data.visitId,
    data.email,
    data.group,
    data.timeOnPage,
    data.deviceType,
    data.region,
    data.language,
    data.source
  ]);
}

function parsePayload_(e) {
  const raw =
    e.postData && e.postData.contents ? e.postData.contents : "";

  try {
    return JSON.parse(raw);
  } catch (error) {
    const params = {};
    raw.split("&").forEach((pair) => {
      if (!pair) return;
      const separator = pair.indexOf("=");
      const key = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      params[decodeURIComponent(key)] = decodeURIComponent(value || "");
    });
    return params;
  }
}

function clean_(value, fallback) {
  const text = String(value || "").trim();
  return text ? text.slice(0, 500) : fallback;
}

function toNumber_(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
}

function isValidEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
```
