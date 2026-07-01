# Seatly 维护说明

Seatly 是一个纯静态婚礼座位表工具，部署到 Cloudflare Pages 即可使用。网站本体在 `index.html`，唯一后端是 `functions/verify.js`，只负责向 Payhip 校验 license key。

## 文件结构

```text
/index.html            主页面和全部前端功能
/functions/verify.js   Cloudflare Pages Function，用来校验 Payhip license
/assets/favicon.svg    浏览器图标
/assets/og-image.png   社交平台分享预览图
```

## 怎么改价格文案

打开 `index.html`，搜索：

```text
$12
```

把页面里看到的 `$12` 或 `$12 USD one-time` 改成新的价格文案即可。这个价格只影响页面显示，不会改变 Payhip 商品价格。真正收款价格要去 Payhip 后台改商品。

## 怎么换 Payhip 链接

打开 `index.html`，搜索：

```js
const PAYHIP_URL = 'https://payhip.com/b/wKSXy';
```

把链接替换成新的 Payhip 商品链接。

然后打开 `functions/verify.js`，搜索：

```js
const PRODUCT_LINK = 'wKSXy';
```

把 `wKSXy` 改成新 Payhip 商品链接最后那段 permalink。比如新链接是 `https://payhip.com/b/ABCDE`，这里就填 `ABCDE`。

## Cloudflare 里怎么填 PAYHIP_PRODUCT_SECRET_KEY

1. 进入 Cloudflare Dashboard。
2. 打开 Workers & Pages。
3. 选择 Seatly 这个 Pages 项目。
4. 进入 Settings。
5. 找到 Environment variables。
6. 添加变量：

```text
PAYHIP_PRODUCT_SECRET_KEY
```

7. 值填 Payhip 产品编辑页里 license keys 区域显示的 product secret key。
8. 保存后重新部署一次。

不要把 Payhip product secret key 写进 `index.html` 或任何公开文件。

## 怎么重新部署

1. 把这个仓库推送到连接 Cloudflare Pages 的 GitHub 仓库。
2. Cloudflare Pages 会自动开始部署。
3. 如果没有自动部署，进入 Cloudflare Pages 项目，点 Deployments，再点 Retry deployment。
4. 部署完成后，打开线上网址测试：
   - 添加客人
   - 添加桌子
   - 刷新页面确认没有丢数据
   - 点击 Download exports
   - 购买后粘贴 license key 解锁
   - 下载 PDF、PNG、CSV 名单

## 本地预览

直接打开 `index.html` 可以查看页面，但 license 校验需要 Cloudflare Pages Functions 环境。最终购买解锁流程请在线上 Cloudflare Pages 部署后测试。
