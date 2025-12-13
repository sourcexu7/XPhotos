# Ant Design 设计规范速查表

## 🎨 设计原则

### 四大核心原则

1. **自然 (Natural)**
   - 遵循自然交互规律
   - 减少用户认知负担
   - 符合人类直觉

2. **确定性 (Certain)**
   - 每个操作都有明确反馈
   - 结果可预期
   - 状态清晰可见

3. **意义 (Meaningful)**
   - 合理的信息层级
   - 清晰的视觉引导
   - 有意义的动效

4. **生长性 (Growth)**
   - 灵活的扩展能力
   - 可复用的组件
   - 持续优化

---

## 📐 间距系统

### 8px 栅格系统

Ant Design 使用 **8px** 作为基础间距单位。

| Token 名称 | 数值 | 使用场景 |
|-----------|------|---------|
| `paddingXXS` | 4px | 极小间距，如图标与文字 |
| `paddingXS` | 8px | 很小间距，如紧凑型按钮 |
| `paddingSM` | 12px | 小间距，如小型卡片内边距 |
| `padding` | 16px | **标准间距**，最常用 |
| `paddingMD` | 20px | 中等间距 |
| `paddingLG` | 24px | 大间距，如大型卡片 |
| `paddingXL` | 32px | 很大间距，如页面容器 |
| `paddingXXL` | 48px | 极大间距，如大型分区 |

### 使用示例

```tsx
import { theme } from 'antd'

const { token } = theme.useToken()

// ✅ 正确：使用 Token
<div style={{ padding: token.padding }}>内容</div>

// ❌ 错误：硬编码
<div style={{ padding: 16 }}>内容</div>

// ✅ 正确：组合使用
<div style={{ 
  paddingTop: token.paddingLG,
  paddingBottom: token.paddingMD,
  paddingLeft: token.padding,
  paddingRight: token.padding,
}}>
  内容
</div>
```

---

## 🎯 圆角规范

### 圆角尺寸

| Token 名称 | 默认值 | 使用场景 |
|-----------|-------|---------|
| `borderRadiusXS` | 2px | 极小圆角，如 Tag |
| `borderRadiusSM` | 4px | 小圆角，如 Button |
| `borderRadius` | 6px | **标准圆角**，如 Input |
| `borderRadiusLG` | 8px | 大圆角，如 Card |
| `borderRadiusOuter` | 4px | 外部容器圆角 |

### 使用场景

```tsx
// Card 组件
<Card style={{ borderRadius: token.borderRadiusLG }}>卡片</Card>

// Button 组件
<Button style={{ borderRadius: token.borderRadiusSM }}>按钮</Button>

// Input 组件
<Input style={{ borderRadius: token.borderRadius }} />
```

---

## 🌈 色彩系统

### 品牌色

| 颜色类型 | Token 名称 | 默认值 | 用途 |
|---------|-----------|-------|------|
| 主色 | `colorPrimary` | #1677ff | 品牌色、主要操作 |
| 成功 | `colorSuccess` | #52c41a | 成功状态 |
| 警告 | `colorWarning` | #faad14 | 警告提示 |
| 错误 | `colorError` | #ff4d4f | 错误、危险操作 |
| 信息 | `colorInfo` | #1677ff | 信息提示 |

### 中性色

| 用途 | Token 名称 | 亮色模式 | 暗色模式 |
|------|-----------|---------|---------|
| 主文本 | `colorText` | rgba(0,0,0,0.88) | rgba(255,255,255,0.85) |
| 次要文本 | `colorTextSecondary` | rgba(0,0,0,0.65) | rgba(255,255,255,0.65) |
| 第三级文本 | `colorTextTertiary` | rgba(0,0,0,0.45) | rgba(255,255,255,0.45) |
| 禁用文本 | `colorTextQuaternary` | rgba(0,0,0,0.25) | rgba(255,255,255,0.25) |

### 背景色

| 用途 | Token 名称 | 亮色模式 | 暗色模式 |
|------|-----------|---------|---------|
| 容器背景 | `colorBgContainer` | #ffffff | #141414 |
| 浮层背景 | `colorBgElevated` | #ffffff | #1f1f1f |
| 布局背景 | `colorBgLayout` | #f5f5f5 | #000000 |
| Hover 背景 | `colorBgTextHover` | rgba(0,0,0,0.06) | rgba(255,255,255,0.08) |

### 边框色

| 用途 | Token 名称 | 亮色模式 | 暗色模式 |
|------|-----------|---------|---------|
| 主边框 | `colorBorder` | #d9d9d9 | rgba(255,255,255,0.12) |
| 次要边框 | `colorBorderSecondary` | #f0f0f0 | rgba(255,255,255,0.06) |

---

## 🎭 阴影系统

### 标准阴影

```tsx
// 小阴影 - 用于悬浮卡片
boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'

// 中等阴影 - 用于弹出层
boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)'

// 大阴影 - 用于模态框
boxShadow: '0 12px 48px 16px rgba(0, 0, 0, 0.03), 0 9px 28px 0 rgba(0, 0, 0, 0.05), 0 6px 16px -8px rgba(0, 0, 0, 0.08)'
```

### Token 使用

| Token 名称 | 用途 |
|-----------|------|
| `boxShadow` | 小阴影，卡片 |
| `boxShadowSecondary` | 中等阴影，弹出层 |
| `boxShadowTertiary` | 大阴影，模态框 |

---

## 📝 字体规范

### 字体大小

| Token 名称 | 数值 | 使用场景 |
|-----------|------|---------|
| `fontSizeSM` | 12px | 辅助文字、说明 |
| `fontSize` | 14px | **标准字号**，正文 |
| `fontSizeLG` | 16px | 小标题 |
| `fontSizeXL` | 20px | 大标题 |
| `fontSizeHeading1` | 38px | 一级标题 |
| `fontSizeHeading2` | 30px | 二级标题 |
| `fontSizeHeading3` | 24px | 三级标题 |
| `fontSizeHeading4` | 20px | 四级标题 |
| `fontSizeHeading5` | 16px | 五级标题 |

### 字体粗细

| Token 名称 | 数值 | 使用场景 |
|-----------|------|---------|
| `fontWeightStrong` | 600 | 强调文本 |
| 常规 | 400 | 正文 |

### 行高

| Token 名称 | 数值 | 使用场景 |
|-----------|------|---------|
| `lineHeight` | 1.5714 | 标准行高 |
| `lineHeightLG` | 1.5 | 大行高 |
| `lineHeightSM` | 1.66 | 小行高 |
| `lineHeightHeading1` | 1.2105 | 一级标题 |
| `lineHeightHeading2` | 1.2666 | 二级标题 |
| `lineHeightHeading3` | 1.3333 | 三级标题 |

---

## 🏗️ 布局规范

### Grid 栅格系统

Ant Design 使用 **24 列栅格系统**。

```tsx
import { Row, Col } from 'antd'

<Row gutter={16}>
  <Col xs={24} sm={12} md={8} lg={6}>
    内容
  </Col>
</Row>
```

### 响应式断点

| 断点 | 最小宽度 | 使用场景 |
|------|---------|---------|
| `xs` | < 576px | 手机竖屏 |
| `sm` | ≥ 576px | 手机横屏 |
| `md` | ≥ 768px | 平板竖屏 |
| `lg` | ≥ 992px | 平板横屏 |
| `xl` | ≥ 1200px | 小型桌面 |
| `xxl` | ≥ 1600px | 大型桌面 |

### Layout 组件

```tsx
import { Layout } from 'antd'

const { Header, Sider, Content, Footer } = Layout

// 标准布局高度
Header: 64px
Sider: 200-260px (可折叠)
Footer: 64px
```

---

## 🎪 组件规范

### Button 按钮

#### 尺寸

| 尺寸 | 高度 | 内边距 | 字号 |
|------|------|-------|------|
| large | 40px | 15px 16px | 16px |
| middle | 32px | 4px 16px | 14px |
| small | 24px | 0px 8px | 14px |

#### 类型

```tsx
// 主按钮 - 重要操作
<Button type="primary">确定</Button>

// 默认按钮 - 次要操作
<Button>取消</Button>

// 虚线按钮 - 添加操作
<Button type="dashed">添加</Button>

// 文本按钮 - 弱操作
<Button type="text">查看详情</Button>

// 链接按钮
<Button type="link">链接</Button>

// 危险按钮
<Button danger>删除</Button>
```

### Card 卡片

#### 标准样式

```tsx
import { Card, theme } from 'antd'

const { token } = theme.useToken()

<Card
  bordered={false}
  style={{
    borderRadius: token.borderRadiusLG,
    boxShadow: token.boxShadow,
  }}
>
  内容
</Card>
```

#### 带 Hover 效果

```tsx
const [isHovered, setIsHovered] = React.useState(false)

<Card
  bordered={false}
  style={{
    borderRadius: token.borderRadiusLG,
    boxShadow: isHovered ? token.boxShadowSecondary : token.boxShadow,
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
    transition: 'all 0.3s',
  }}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
>
  内容
</Card>
```

### Form 表单

#### 标准布局

```tsx
import { Form, Input, Button } from 'antd'

<Form
  layout="vertical"
  requiredMark={false}
  labelCol={{ span: 24 }}
  wrapperCol={{ span: 24 }}
>
  <Form.Item
    label="用户名"
    name="username"
    rules={[{ required: true, message: '请输入用户名' }]}
  >
    <Input placeholder="请输入" />
  </Form.Item>
  
  <Form.Item>
    <Button type="primary" htmlType="submit">
      提交
    </Button>
  </Form.Item>
</Form>
```

#### 间距规范

- Label 与 Input 间距：8px
- Form.Item 之间间距：24px
- 表单按钮顶部间距：24px

### Table 表格

#### 标准配置

```tsx
import { Table } from 'antd'

<Table
  columns={columns}
  dataSource={data}
  bordered={false}
  size="middle"
  pagination={{
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
  }}
/>
```

---

## 🎬 动效规范

### 动画时长

| 用途 | 时长 | 缓动函数 |
|------|------|---------|
| 小组件 | 0.1s | ease-in-out |
| 中等组件 | 0.2s | ease-in-out |
| 大组件 | 0.3s | ease-in-out |
| 页面切换 | 0.4s | cubic-bezier(0.4, 0, 0.2, 1) |

### 常用动画

```tsx
// Fade 淡入淡出
transition: 'opacity 0.3s ease-in-out'

// Slide 滑动
transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'

// Scale 缩放
transition: 'transform 0.2s ease-in-out'

// 组合动画
transition: 'all 0.3s ease-in-out'
```

---

## 📱 响应式规范

### 移动端优化

```tsx
import { Grid } from 'antd'

const { useBreakpoint } = Grid

function Component() {
  const screens = useBreakpoint()
  
  return (
    <div>
      {screens.xs && <div>手机视图</div>}
      {screens.md && <div>平板视图</div>}
      {screens.lg && <div>桌面视图</div>}
    </div>
  )
}
```

### 常用响应式模式

```tsx
// 响应式布局
<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} md={8} lg={6}>
    卡片
  </Col>
</Row>

// 响应式 Sider
<Sider
  collapsedWidth={screens.xs ? 0 : 80}
  breakpoint="lg"
  onBreakpoint={(broken) => {
    console.log(broken)
  }}
>
  侧边栏
</Sider>
```

---

## 🎯 最佳实践

### ✅ DO（推荐做法）

```tsx
// 1. 使用 Token 系统
const { token } = theme.useToken()
<div style={{ padding: token.padding }} />

// 2. 使用组件默认样式
<Button type="primary">按钮</Button>

// 3. 使用 Space 组件管理间距
<Space size={16}>
  <Button>按钮1</Button>
  <Button>按钮2</Button>
</Space>

// 4. 使用 ConfigProvider 统一配置
<ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }}>
  <App />
</ConfigProvider>

// 5. 使用响应式断点
const screens = useBreakpoint()
```

### ❌ DON'T（不推荐做法）

```tsx
// ❌ 硬编码颜色
<div style={{ color: '#1890ff' }} />

// ❌ 硬编码间距
<div style={{ padding: 16 }} />

// ❌ 使用 inline style 覆盖组件样式
<Button style={{ background: 'red' }}>按钮</Button>

// ❌ 不使用 Space 组件
<div>
  <span style={{ marginRight: 8 }}>文字</span>
  <span>文字</span>
</div>

// ❌ 混用多种样式方案
<div className="p-4" style={{ padding: token.padding }} />
```

---

## 🔧 实用代码片段

### 标准 Card 组件

```tsx
import { Card, theme } from 'antd'

const StyledCard = ({ children, ...props }) => {
  const { token } = theme.useToken()
  const [isHovered, setIsHovered] = React.useState(false)
  
  return (
    <Card
      bordered={false}
      style={{
        borderRadius: token.borderRadiusLG,
        boxShadow: isHovered ? token.boxShadowSecondary : token.boxShadow,
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.3s',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
    </Card>
  )
}
```

### 响应式容器

```tsx
const ResponsiveContainer = ({ children }) => {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  
  return (
    <div
      style={{
        maxWidth: screens.lg ? 1200 : '100%',
        margin: '0 auto',
        padding: screens.xs ? token.paddingSM : token.paddingLG,
      }}
    >
      {children}
    </div>
  )
}
```

### 统一按钮组

```tsx
import { Space, Button } from 'antd'

const ActionButtons = ({ onOk, onCancel }) => {
  const { token } = theme.useToken()
  
  return (
    <Space size={token.marginSM}>
      <Button onClick={onCancel}>取消</Button>
      <Button type="primary" onClick={onOk}>确定</Button>
    </Space>
  )
}
```

---

## 📚 参考资源

- [Ant Design 官方文档](https://ant.design/)
- [设计价值观](https://ant.design/docs/spec/values-cn)
- [设计模式](https://ant.design/docs/spec/overview-cn)
- [可视化](https://ant.design/docs/spec/visual-cn)
- [动效](https://ant.design/docs/spec/motion-cn)
- [主题定制](https://ant.design/docs/react/customize-theme-cn)

---

**文档版本**: v1.0  
**最后更新**: 2025-11-26  
**维护者**: GitHub Copilot
