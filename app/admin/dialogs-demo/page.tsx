'use client'

import React, { useState } from 'react'
import {
  Modal,
  Drawer,
  Popconfirm,
  Button,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Switch,
  Alert,
  Space,
  Typography,
  Divider,
  Tag,
  message,
  Tooltip,
  List,
  Avatar,
  Badge,
  Descriptions,
  Checkbox,
} from 'antd'
import {
  InfoCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

export default function AntdDialogsDemo() {
  const [modal1Open, setModal1Open] = useState(false)
  const [modal2Open, setModal2Open] = useState(false)
  const [modal3Open, setModal3Open] = useState(false)
  const [drawer1Open, setDrawer1Open] = useState(false)
  const [formInstance] = Form.useForm()

  const handleDeleteConfirm = () => {
    message.success('已删除 1 张图片')
  }

  const handleFormSubmit = async () => {
    try {
      await formInstance.validateFields()
      const values = formInstance.getFieldsValue()
      console.log('提交数据:', values)
      message.success('设置已保存')
      setModal2Open(false)
    } catch {
      message.error('请检查表单填写')
    }
  }

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '32px 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* —— Hero 标题区 —— */}
        <div style={{ marginBottom: 28 }}>
          <Space size={8} align="center" style={{ marginBottom: 8 }}>
            <Tag color="blue" style={{ fontSize: 12, padding: '2px 10px', marginRight: 0 }}>
              后台交互规范
            </Tag>
            <Text type="secondary" style={{ fontSize: 13 }}>
              统一使用 Ant Design 组件库 · v5
            </Text>
          </Space>
          <Title level={2} style={{ marginBottom: 8, marginTop: 0 }}>
            弹框与抽屉组件演示
          </Title>
          <Paragraph type="secondary" style={{ fontSize: 14, marginBottom: 0 }}>
            下面展示 6 个在后台常见的交互场景：基础信息弹窗、表单弹窗、删除确认、表单抽屉、查看抽屉，以及操作条内的确认。
            所有弹窗与抽屉遵循相同的视觉规范：主操作在右、次操作在左；确认类操作使用 Popconfirm 或 Modal。
          </Paragraph>
        </div>

        {/* —— 顶部提示条 —— */}
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 24, borderRadius: 8 }}
          message="设计规范速览"
          description={
            <Space size={24} wrap>
              <Text>主色：#1677ff</Text>
              <Text>圆角：6px</Text>
              <Text>弹框标题：16px / 600</Text>
              <Text>表单标签：14px / 500</Text>
              <Text>间距：8 / 16 / 24</Text>
            </Space>
          }
        />

        {/* —— 场景卡片区 —— */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* 场景 1 */}
          <div style={{ gridColumn: 'span 7' }}>
            <CardBox
              index="01"
              title="基础信息弹窗"
              description="用于展示只读信息、说明文档、使用提示。结构简单，仅需一个关闭操作。"
            >
              <Typography>
                <Paragraph>
                  <Text strong>图片 ID：</Text>
                  <Text>IMG_20260612_0042.jpg</Text>
                </Paragraph>
                <Descriptions column={2} size="small" bordered style={{ marginBottom: 0 }}>
                  <Descriptions.Item label="文件大小">3.8 MB</Descriptions.Item>
                  <Descriptions.Item label="尺寸">6000 × 4000</Descriptions.Item>
                  <Descriptions.Item label="拍摄时间">2026-06-12 15:24</Descriptions.Item>
                  <Descriptions.Item label="相机">Sony A7M4</Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Badge status="success" text="已同步" />
                  </Descriptions.Item>
                  <Descriptions.Item label="相册">城市夜景</Descriptions.Item>
                </Descriptions>
              </Typography>
              <Divider style={{ margin: '16px 0' }} />
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setModal1Open(true)} icon={<EyeOutlined />}>
                  预览信息弹窗
                </Button>
              </Space>
            </CardBox>
          </div>

          {/* 场景 2 */}
          <div style={{ gridColumn: 'span 5' }}>
            <CardBox
              index="02"
              title="删除操作确认"
              description="对不可恢复的操作（如删除图片、移除相册），使用 Popconfirm 进行二次确认，避免误操作。"
            >
              <List
                size="small"
                dataSource={[
                  { title: 'IMG_20260612_0042.jpg', tag: '已发布' },
                  { title: 'IMG_20260612_0045.jpg', tag: '草稿' },
                  { title: 'IMG_20260612_0051.jpg', tag: '已发布' },
                ]}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Popconfirm
                        key="delete"
                        title="确认删除？"
                        description="删除后图片将进入回收站，30 天后自动清除。"
                        okText="删除"
                        okButtonProps={{ danger: true }}
                        cancelText="取消"
                        onConfirm={handleDeleteConfirm}
                        icon={<QuestionCircleOutlined style={{ color: '#ff4d4f' }} />}
                      >
                        <Button size="small" danger type="text" icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<FileTextOutlined />} style={{ background: '#e6f4ff', color: '#1677ff' }} />}
                      title={item.title}
                      description={
                        <Tag color="blue" style={{ margin: 0, fontSize: 12 }}>
                          {item.tag}
                        </Tag>
                      }
                    />
                  </List.Item>
                )}
              />
            </CardBox>
          </div>

          {/* 场景 3 */}
          <div style={{ gridColumn: 'span 6' }}>
            <CardBox
              index="03"
              title="表单弹窗（设置）"
              description="字段数较少（≤6 项）的设置/编辑操作，用 Modal 承载表单。弹出层内校验，关闭后状态回滚。"
            >
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Alert type="info" showIcon message="以下为预览示例。点击按钮可打开真实表单弹窗。" />
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Text strong style={{ width: 88, textAlign: 'right', color: '#595959' }}>
                    站点名称：
                  </Text>
                  <Input size="small" defaultValue="我的相册" disabled style={{ flex: 1 }} />
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Text strong style={{ width: 88, textAlign: 'right', color: '#595959' }}>
                    最大上传：
                  </Text>
                  <InputNumber size="small" defaultValue={10} min={1} max={100} disabled style={{ width: 120 }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    MB
                  </Text>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Text strong style={{ width: 88, textAlign: 'right', color: '#595959' }}>
                    默认排序：
                  </Text>
                  <Radio.Group size="small" defaultValue="desc" disabled>
                    <Radio value="desc">创建时间倒序</Radio>
                    <Radio value="asc">创建时间升序</Radio>
                    <Radio value="custom">自定义</Radio>
                  </Radio.Group>
                </div>
              </Space>
              <Divider style={{ margin: '16px 0' }} />
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setModal2Open(true)} type="primary" icon={<EditOutlined />}>
                  打开设置弹窗
                </Button>
              </Space>
            </CardBox>
          </div>

          {/* 场景 4 */}
          <div style={{ gridColumn: 'span 6' }}>
            <CardBox
              index="04"
              title="侧边抽屉（编辑）"
              description="编辑图片信息这类边做边看的操作，用 Drawer 比 Modal 更合适。抽屉不遮挡整屏，保留列表上下文。"
            >
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Alert type="warning" showIcon message="抽屉适用于需要对照后台列表进行编辑的场景。" />
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Text strong style={{ width: 88, textAlign: 'right', color: '#595959' }}>
                    图片标题：
                  </Text>
                  <Text>外滩夜景 · 陆家嘴天际线</Text>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Text strong style={{ width: 88, textAlign: 'right', color: '#595959' }}>
                    所属相册：
                  </Text>
                  <Tag color="blue">城市夜景</Tag>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Text strong style={{ width: 88, textAlign: 'right', color: '#595959', paddingTop: 4 }}>
                    标签：
                  </Text>
                  <div style={{ flex: 1 }}>
                    <Space size={6} wrap>
                      <Tag>建筑</Tag>
                      <Tag>夜景</Tag>
                      <Tag>上海</Tag>
                      <Tag>灯光</Tag>
                    </Space>
                  </div>
                </div>
              </Space>
              <Divider style={{ margin: '16px 0' }} />
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setDrawer1Open(true)} type="primary" icon={<EditOutlined />}>
                  打开编辑抽屉
                </Button>
              </Space>
            </CardBox>
          </div>

          {/* 场景 5 */}
          <div style={{ gridColumn: 'span 7' }}>
            <CardBox
              index="05"
              title="批量操作确认"
              description="批量操作（批量删除、批量移动相册）需要在 Modal 中列出受影响项，让用户明确确认后再提交。"
            >
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
                message={
                  <Text>
                    已选中 <Text strong>12</Text> 张图片进行批量操作
                  </Text>
                }
              />
              <List
                size="small"
                bordered
                dataSource={[
                  'IMG_20260612_0042.jpg',
                  'IMG_20260612_0045.jpg',
                  'IMG_20260612_0051.jpg',
                  'IMG_20260612_0063.jpg',
                  '...（其余 8 张已省略）',
                ]}
                renderItem={(item, idx) => (
                  <List.Item>
                    <Space>
                      <Text type="secondary" style={{ width: 24 }}>
                        {idx + 1}.
                      </Text>
                      <Text>{item}</Text>
                    </Space>
                  </List.Item>
                )}
              />
              <Divider style={{ margin: '16px 0' }} />
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Tooltip title="移动到其他相册">
                  <Button icon={<AppstoreOutlined />}>移动到相册</Button>
                </Tooltip>
                <Popconfirm
                  title="确认批量删除？"
                  description="选中的 12 张图片将被移动到回收站，可在 30 天内恢复。"
                  okText="确认删除"
                  okButtonProps={{ danger: true, type: 'primary' }}
                  cancelText="取消"
                  onConfirm={() => message.success('12 张图片已移至回收站')}
                  icon={<QuestionCircleOutlined style={{ color: '#ff4d4f' }} />}
                >
                  <Button danger type="primary" icon={<DeleteOutlined />}>
                    批量删除
                  </Button>
                </Popconfirm>
              </Space>
            </CardBox>
          </div>

          {/* 场景 6 */}
          <div style={{ gridColumn: 'span 5' }}>
            <CardBox
              index="06"
              title="状态反馈"
              description="操作成功后不建议再弹 Modal，使用 message / notification 做轻量反馈。错误场景才需要弹窗说明。"
            >
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Alert
                  type="success"
                  showIcon
                  message="操作成功"
                  description="图片信息已更新，前台将在 5 分钟内生效。"
                />
                <Alert type="info" showIcon message="系统提示：已自动保存草稿。" />
                <Alert type="warning" showIcon message="部分字段未填写，但已保存当前内容。" />
                <Alert
                  type="error"
                  showIcon
                  message="上传失败"
                  description="对象存储未配置，请前往 设置 → 存储 完成配置后重试。"
                />
              </Space>
              <Divider style={{ margin: '16px 0' }} />
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => message.info('这是一条信息提示')}>Info</Button>
                <Button onClick={() => message.success('操作成功')}>Success</Button>
                <Button onClick={() => message.warning('请检查输入')}>Warning</Button>
                <Button danger onClick={() => message.error('操作失败')}>
                  Error
                </Button>
              </Space>
            </CardBox>
          </div>
        </div>

        {/* —— 底部总结 —— */}
        <Alert
          type="success"
          showIcon
          style={{ borderRadius: 8 }}
          icon={<CheckCircleOutlined />}
          message="组件选型总结"
          description={
            <Space direction="vertical" size={4} style={{ marginTop: 4 }}>
              <Text>
                <Text strong>Modal：</Text>
                用于需要打断当前操作的模态任务（确认删除、填写关键表单）。
              </Text>
              <Text>
                <Text strong>Drawer：</Text>
                用于编辑图片详情、查看大图信息等不需要完全打断的场景。
              </Text>
              <Text>
                <Text strong>Popconfirm：</Text>
                用于单条数据的轻量二次确认（列表内删除、切换开关等）。
              </Text>
              <Text>
                <Text strong>message / notification：</Text>
                操作结果反馈，不阻断后续操作。
              </Text>
            </Space>
          }
        />

        {/* ================== Modal 1：基础信息弹窗 ================== */}
        <Modal
          open={modal1Open}
          title={
            <Space>
              <InfoCircleOutlined style={{ color: '#1677ff' }} />
              <span>图片详情信息</span>
            </Space>
          }
          onCancel={() => setModal1Open(false)}
          onOk={() => setModal1Open(false)}
          okText="确定"
          cancelText="关闭"
          width={560}
          footer={[
            <Button key="close" onClick={() => setModal1Open(false)}>
              关闭
            </Button>,
          ]}
        >
          <Descriptions column={2} size="default" bordered>
            <Descriptions.Item label="图片 ID">IMG_20260612_0042.jpg</Descriptions.Item>
            <Descriptions.Item label="文件大小">3.8 MB</Descriptions.Item>
            <Descriptions.Item label="尺寸">6000 × 4000</Descriptions.Item>
            <Descriptions.Item label="相机">Sony A7M4</Descriptions.Item>
            <Descriptions.Item label="拍摄时间">2026-06-12 15:24</Descriptions.Item>
            <Descriptions.Item label="ISO">400</Descriptions.Item>
            <Descriptions.Item label="光圈">f/2.8</Descriptions.Item>
            <Descriptions.Item label="快门">1/125 s</Descriptions.Item>
            <Descriptions.Item label="状态" span={2}>
              <Badge status="success" text="已发布 · 公开可见" />
            </Descriptions.Item>
          </Descriptions>
        </Modal>

        {/* ================== Modal 2：设置表单弹窗 ================== */}
        <Modal
          open={modal2Open}
          title={
            <Space>
              <SettingOutlined style={{ color: '#1677ff' }} />
              <span>站点设置</span>
            </Space>
          }
          onCancel={() => setModal2Open(false)}
          onOk={handleFormSubmit}
          okText="保存设置"
          cancelText="取消"
          okButtonProps={{ type: 'primary' }}
          width={600}
          maskClosable={false}
          destroyOnClose
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="修改站点名称、默认排序等设置后，前台会在 5 分钟内生效。"
          />
          <Form form={formInstance} layout="vertical" initialValues={{ siteName: '我的相册', maxUpload: 10, sort: 'desc', enableWatermark: true }}>
            <Form.Item label="站点名称" name="siteName" rules={[{ required: true, message: '请填写站点名称' }]}>
              <Input placeholder="请输入站点名称" maxLength={30} showCount />
            </Form.Item>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item label="单张图片最大上传（MB）" name="maxUpload" style={{ flex: 1 }} rules={[{ required: true, message: '必填' }]}>
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="默认排序" name="sort" style={{ flex: 1 }}>
                <Select
                  options={[
                    { label: '创建时间倒序', value: 'desc' },
                    { label: '创建时间升序', value: 'asc' },
                    { label: '自定义顺序', value: 'custom' },
                  ]}
                />
              </Form.Item>
            </div>
            <Form.Item label="上传类型限制" name="fileType">
              <CheckboxGroup />
            </Form.Item>
            <Form.Item label="开启图片水印" name="enableWatermark" valuePropName="checked">
              <Switch checkedChildren="开启" unCheckedChildren="关闭" />
            </Form.Item>
            <Form.Item label="备注说明" name="remark">
              <TextArea rows={3} maxLength={200} showCount placeholder="可选，仅后台可见" />
            </Form.Item>
          </Form>
        </Modal>

        {/* ================== Modal 3：批量删除确认 ================== */}
        <Modal
          open={modal3Open}
          title="确认批量删除？"
          onCancel={() => setModal3Open(false)}
          onOk={() => {
            message.success('12 张图片已移至回收站')
            setModal3Open(false)
          }}
          okText="确认删除"
          okButtonProps={{ danger: true, type: 'primary' }}
          cancelText="取消"
          width={480}
          centered
        >
          <Alert
            type="warning"
            showIcon
            message="删除后图片将移至回收站，30 天内可恢复，之后会永久删除。"
            style={{ marginBottom: 12 }}
          />
          <Text type="secondary">将对以下 12 张图片执行操作：</Text>
          <div style={{ marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 6 }}>
            <Space size={6} wrap>
              {['IMG_0042', 'IMG_0045', 'IMG_0051', 'IMG_0063', 'IMG_0074', 'IMG_0088'].map((n) => (
                <Tag key={n}>{n}.jpg</Tag>
              ))}
              <Text type="secondary" style={{ fontSize: 12 }}>
                ...还有 6 张
              </Text>
            </Space>
          </div>
        </Modal>

        {/* ================== Drawer 1：图片信息编辑抽屉 ================== */}
        <Drawer
          title={
            <Space>
              <EditOutlined />
              <span>编辑图片信息</span>
            </Space>
          }
          open={drawer1Open}
          onClose={() => setDrawer1Open(false)}
          size={560}
          extra={
            <Space>
              <Button onClick={() => setDrawer1Open(false)}>取消</Button>
              <Button type="primary" onClick={() => { message.success('已保存'); setDrawer1Open(false) }}>
                保存
              </Button>
            </Space>
          }
        >
          <Text type="secondary" strong style={{ display: 'block', marginTop: 0, marginBottom: 8, fontSize: 12 }}>
            基本信息
          </Text>
          <Form layout="vertical">
            <Form.Item label="图片标题" rules={[{ required: true, message: '请填写标题' }]}>
              <Input placeholder="例如：外滩夜景 · 陆家嘴天际线" defaultValue="外滩夜景 · 陆家嘴天际线" />
            </Form.Item>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item label="拍摄时间" style={{ flex: 1 }}>
                <Input placeholder="2026-06-12 15:24" defaultValue="2026-06-12 15:24" />
              </Form.Item>
              <Form.Item label="是否展示水印" style={{ flex: 1, marginBottom: 0 }}>
                <Select
                  defaultValue="inherit"
                  options={[
                    { label: '跟随站点设置', value: 'inherit' },
                    { label: '始终开启', value: 'on' },
                    { label: '始终关闭', value: 'off' },
                  ]}
                />
              </Form.Item>
            </div>

            <Text type="secondary" strong style={{ display: 'block', marginTop: 12, marginBottom: 8, fontSize: 12 }}>
              分类与标签
            </Text>
            <Form.Item label="所属相册">
              <Select
                mode="multiple"
                placeholder="选择一个或多个相册"
                defaultValue={['城市夜景']}
                style={{ width: '100%' }}
                options={[
                  { label: '城市夜景', value: '城市夜景' },
                  { label: '自然风光', value: '自然风光' },
                  { label: '人文纪实', value: '人文纪实' },
                  { label: '建筑', value: '建筑' },
                ]}
              />
            </Form.Item>
            <Form.Item label="标签">
              <Select
                mode="tags"
                placeholder="输入标签后回车"
                defaultValue={['建筑', '夜景', '上海', '灯光']}
                style={{ width: '100%' }}
                tokenSeparators={[',', '，']}
              />
            </Form.Item>
            <Form.Item label="详细描述">
              <TextArea rows={4} placeholder="可填写拍摄故事、参数说明等" />
            </Form.Item>
          </Form>
        </Drawer>
      </div>
    </div>
  )
}

/* ============ 小组件：卡片容器 ============ */
function CardBox({
  index,
  title,
  description,
  children,
}: {
  index: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 8,
        padding: 20,
        border: '1px solid #f0f0f0',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02)',
      }}
    >
      <Space size={12} align="start" style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: '#1677ff',
            lineHeight: 1,
            paddingTop: 2,
            fontFamily: 'SF Mono, Menlo, monospace',
          }}
        >
          {index}
        </div>
        <div style={{ flex: 1 }}>
          <Title level={5} style={{ margin: '0 0 4px 0', fontSize: 16 }}>
            {title}
          </Title>
          <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
            {description}
          </Text>
        </div>
      </Space>
      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}

/* ============ 小组件：文件类型多选 ============ */
function CheckboxGroup() {
  return (
    <Checkbox.Group
      options={[
        { label: 'JPG / JPEG', value: 'jpg' },
        { label: 'PNG', value: 'png' },
        { label: 'WebP', value: 'webp' },
        { label: 'HEIC', value: 'heic' },
        { label: 'RAW', value: 'raw' },
      ]}
      defaultValue={['jpg', 'png', 'webp']}
    />
  )
}
