'use client'

import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Select, Slider, Card, Space, App, Alert, Typography, Switch, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { BorderBeam } from '~/components/ui/border-beam'
import { RobotOutlined, ApiOutlined, SaveOutlined, FileTextOutlined, UndoOutlined, TagsOutlined, WalletOutlined, ReloadOutlined } from '@ant-design/icons'
import AdminPageHeader from '~/components/admin/layout/page-header'
import { useTranslations } from 'next-intl'

interface AIConfig {
  config_key: string
  config_value: string
  hasKey?: boolean
}

interface BalanceInfo {
  currency: string
  total_balance: string
  granted_balance: string
  topped_up_balance: string
}

interface BalanceResult {
  success: boolean
  message?: string
  is_available?: boolean
  balance_infos?: BalanceInfo[]
}

interface AiUsageItem {
  id: string
  scene: string
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  reasoningTokens: number
  cacheHitTokens: number
  durationMs: number
  success: boolean
  createdAt: string
}

interface UsageSummary {
  todayTokens: number
  todayRequests: number
  monthTokens: number
  monthPromptTokens: number
  monthCompletionTokens: number
  monthRequests: number
}

/** 余额查询结果统一展示（供主模型/视觉模型两张卡片复用） */
const BalanceAlert = ({ result, t, onClose }: { result: BalanceResult | null; t: (k: string) => string; onClose: () => void }) => {
  if (!result) return null
  if (!result.success) {
    return (
      <Alert
        showIcon
        type="error"
        title={t('AIModel.balanceQueryFailed')}
        description={result.message}
        closable
        onClose={onClose}
        style={{ marginTop: 8 }}
      />
    )
  }
  const infos = result.balance_infos ?? []
  const desc = infos.length > 0
    ? infos.map(i =>
        `${i.currency} ${t('AIModel.balanceTotal')} ${i.total_balance}（${t('AIModel.balanceGranted')} ${i.granted_balance} / ${t('AIModel.balanceToppedUp')} ${i.topped_up_balance}）`
      ).join('；')
    : t('AIModel.balanceQueryFailed')
  return (
    <Alert
      showIcon
      type={result.is_available ? 'success' : 'warning'}
      title={result.is_available ? t('AIModel.balanceAvailable') : t('AIModel.balanceUnavailable')}
      description={desc}
      closable
      onClose={onClose}
      style={{ marginTop: 8 }}
    />
  )
}

export default function AIModelSettings() {
  const { message } = App.useApp()
  const t = useTranslations()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [tagTesting, setTagTesting] = useState(false)
  const [tagTestResult, setTagTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [mainBalance, setMainBalance] = useState<BalanceResult | null>(null)
  const [queryingBalance, setQueryingBalance] = useState(false)
  const [tagBalance, setTagBalance] = useState<BalanceResult | null>(null)
  const [queryingTagBalance, setQueryingTagBalance] = useState(false)
  // AI 调用明细
  const [usageItems, setUsageItems] = useState<AiUsageItem[]>([])
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null)
  const [usageLoading, setUsageLoading] = useState(false)
  const [priceInput, setPriceInput] = useState('')
  const [priceOutput, setPriceOutput] = useState('')
  const [savingPrice, setSavingPrice] = useState(false)

  useEffect(() => {
    fetchConfig()
    fetchUsage()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/v1/ai-guide/config', { credentials: 'include' })
      const json = await res.json()
      const configs: AIConfig[] = json.data || []
      const configMap: Record<string, string> = {}
      configs.forEach(item => {
        configMap[item.config_key] = item.config_value
      })
      form.setFieldsValue({
        ai_model_provider: configMap['ai_model_provider'] || 'deepseek',
        ai_model_api_key: configMap['ai_model_api_key'] || '',
        ai_model_base_url: configMap['ai_model_base_url'] || 'https://api.deepseek.com/v1',
        ai_model_name: configMap['ai_model_name'] || 'deepseek-chat',
        ai_model_temperature: parseFloat(configMap['ai_model_temperature'] || '0.3'),
        ai_model_system_prompt: configMap['ai_model_system_prompt'] || '',
        ai_tag_enabled: configMap['ai_tag_enabled'] === '1',
        ai_tag_base_url: configMap['ai_tag_base_url'] || '',
        ai_tag_api_key: configMap['ai_tag_api_key'] || '',
        ai_tag_model: configMap['ai_tag_model'] || '',
      })
      // 单价配置独立于主表单
      setPriceInput(configMap['ai_price_input_per_m'] || '')
      setPriceOutput(configMap['ai_price_output_per_m'] || '')
    } catch (error) {
      console.error('Failed to fetch AI config:', error)
    }
  }

  const handleSave = async () => {
    try {
      const values = form.getFieldsValue()
      setLoading(true)
      const items = [
        { config_key: 'ai_model_provider', config_value: values.ai_model_provider },
        { config_key: 'ai_model_api_key', config_value: values.ai_model_api_key },
        { config_key: 'ai_model_base_url', config_value: values.ai_model_base_url },
        { config_key: 'ai_model_name', config_value: values.ai_model_name },
        { config_key: 'ai_model_temperature', config_value: String(values.ai_model_temperature) },
        { config_key: 'ai_model_system_prompt', config_value: values.ai_model_system_prompt || '' },
        { config_key: 'ai_tag_enabled', config_value: values.ai_tag_enabled ? '1' : '0' },
        { config_key: 'ai_tag_base_url', config_value: values.ai_tag_base_url || '' },
        { config_key: 'ai_tag_api_key', config_value: values.ai_tag_api_key || '' },
        { config_key: 'ai_tag_model', config_value: values.ai_tag_model || '' },
      ]
      const res = await fetch('/api/v1/ai-guide/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(items),
      })
      if (res.ok) {
        message.success(t('AIModel.saveSuccess'))
        await fetchConfig()
      } else {
        message.error(t('AIModel.saveFailed'))
      }
    } catch {
      message.error(t('AIModel.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setTesting(true)
      setTestResult(null)
      const res = await fetch('/api/v1/ai-guide/test-connection', {
        method: 'POST',
        credentials: 'include',
      })
      const json = await res.json()
      setTestResult({ success: json.success, message: json.message })
    } catch (error: any) {
      setTestResult({ success: false, message: error.message })
    } finally {
      setTesting(false)
    }
  }

  const handleTagTestConnection = async () => {
    try {
      setTagTesting(true)
      setTagTestResult(null)
      const res = await fetch('/api/v1/ai-tag/test-connection', {
        method: 'POST',
        credentials: 'include',
      })
      const json = await res.json()
      setTagTestResult({ success: json.success, message: json.message })
    } catch (error: any) {
      setTagTestResult({ success: false, message: error.message })
    } finally {
      setTagTesting(false)
    }
  }

  const queryBalance = async (url: string): Promise<BalanceResult> => {
    const res = await fetch(url, { credentials: 'include' })
    const json = await res.json()
    if (json.success) {
      return { success: true, is_available: json.is_available, balance_infos: json.balance_infos }
    }
    return { success: false, message: json.message }
  }

  const handleQueryBalance = async () => {
    try {
      setQueryingBalance(true)
      setMainBalance(null)
      setMainBalance(await queryBalance('/api/v1/ai-guide/balance'))
    } catch (error: any) {
      setMainBalance({ success: false, message: error.message })
    } finally {
      setQueryingBalance(false)
    }
  }

  const handleQueryTagBalance = async () => {
    try {
      setQueryingTagBalance(true)
      setTagBalance(null)
      setTagBalance(await queryBalance('/api/v1/ai-tag/balance'))
    } catch (error: any) {
      setTagBalance({ success: false, message: error.message })
    } finally {
      setQueryingTagBalance(false)
    }
  }

  const fetchUsage = async () => {
    try {
      setUsageLoading(true)
      const res = await fetch('/api/v1/ai-guide/usage?limit=100', { credentials: 'include' })
      const json = await res.json()
      setUsageItems(json.data?.items ?? [])
      setUsageSummary(json.data?.summary ?? null)
    } catch {
      message.error(t('AIModel.usageLoadFailed'))
    } finally {
      setUsageLoading(false)
    }
  }

  const handleSavePrice = async () => {
    try {
      setSavingPrice(true)
      const res = await fetch('/api/v1/ai-guide/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify([
          { config_key: 'ai_price_input_per_m', config_value: priceInput.trim() || '' },
          { config_key: 'ai_price_output_per_m', config_value: priceOutput.trim() || '' },
        ]),
      })
      if (res.ok) {
        message.success(t('AIModel.usagePriceSaved'))
      } else {
        message.error(t('AIModel.saveFailed'))
      }
    } catch {
      message.error(t('AIModel.saveFailed'))
    } finally {
      setSavingPrice(false)
    }
  }

  const usagePriceIn = parseFloat(priceInput) || 0
  const usagePriceOut = parseFloat(priceOutput) || 0
  const usageCostEnabled = usagePriceIn > 0 || usagePriceOut > 0
  const estCostOf = (promptTokens: number, completionTokens: number) =>
    (promptTokens * usagePriceIn + completionTokens * usagePriceOut) / 1e6
  const fmtCost = (v: number) => `¥${v > 0 && v < 0.01 ? v.toFixed(4) : v.toFixed(2)}`
  const fmtNum = (n: number) => n.toLocaleString()
  const fmtDuration = (ms: number) => (ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`)
  const sceneLabelMap: Record<string, { label: string; color: string }> = {
    guide_parse: { label: t('AIModel.usageSceneGuideParse'), color: 'blue' },
    guide_test: { label: t('AIModel.usageSceneGuideTest'), color: 'default' },
    tag_recommend: { label: t('AIModel.usageSceneTagRecommend'), color: 'green' },
    tag_test: { label: t('AIModel.usageSceneTagTest'), color: 'default' },
  }

  const usageColumns: ColumnsType<AiUsageItem> = [
    {
      title: t('AIModel.usageColTime'),
      dataIndex: 'createdAt',
      width: 150,
      render: (v: string) => new Date(v).toLocaleString(undefined, { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    },
    {
      title: t('AIModel.usageColScene'),
      dataIndex: 'scene',
      width: 110,
      render: (v: string) => {
        const s = sceneLabelMap[v]
        return s ? <Tag color={s.color} style={{ marginInlineEnd: 0 }}>{s.label}</Tag> : v
      },
    },
    { title: t('AIModel.usageColModel'), dataIndex: 'model', width: 200, ellipsis: true },
    {
      title: t('AIModel.usageColInput'),
      dataIndex: 'promptTokens',
      width: 100,
      align: 'right',
      render: (v: number, record) => (
        <span title={record.cacheHitTokens > 0 ? `${t('AIModel.usageCacheHit')} ${fmtNum(record.cacheHitTokens)}` : undefined}>
          {fmtNum(v)}
        </span>
      ),
    },
    {
      title: t('AIModel.usageColOutput'),
      dataIndex: 'completionTokens',
      width: 130,
      align: 'right',
      render: (v: number, record) => (
        <span>
          {fmtNum(v)}
          {record.reasoningTokens > 0 && (
            <span className="text-muted-foreground">（{t('AIModel.usageReasoningShort')} {fmtNum(record.reasoningTokens)}）</span>
          )}
        </span>
      ),
    },
    { title: t('AIModel.usageColTotal'), dataIndex: 'totalTokens', width: 100, align: 'right', render: (v: number) => fmtNum(v) },
    { title: t('AIModel.usageColDuration'), dataIndex: 'durationMs', width: 90, align: 'right', render: (v: number) => fmtDuration(v) },
    ...(usageCostEnabled
      ? [{
          title: t('AIModel.usageColCost'),
          width: 100,
          align: 'right' as const,
          render: (_: any, record: AiUsageItem) => (record.success ? fmtCost(estCostOf(record.promptTokens, record.completionTokens)) : '-'),
        }]
      : []),
    {
      title: t('AIModel.usageColStatus'),
      dataIndex: 'success',
      width: 80,
      render: (v: boolean) => (
        <Tag color={v ? 'success' : 'error'} style={{ marginInlineEnd: 0 }}>
          {v ? t('AIModel.usageStatusOk') : t('AIModel.usageStatusFail')}
        </Tag>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={t('AIModel.title')}
        description={t('AIModel.description')}
        breadcrumbs={[
          { title: t('Link.settings') },
          { title: t('AIModel.title') },
        ]}
      />

      {/* Aurora 流光：hover 时显示，标识 AI 能力入口 */}
      <BorderBeam
        className="[&_.ant-border-beam]:opacity-0 [&_.ant-border-beam]:transition-opacity hover:[&_.ant-border-beam]:opacity-100"
        borderRadius={8}
        color={[
          { color: '#7c3aed', percent: 0 },
          { color: '#06b6d4', percent: 57 },
          { color: '#67e8f9', percent: 100 },
        ]}
      >
      <Card
        title={
          <Space>
            <RobotOutlined />
            {t('AIModel.configTitle')}
          </Space>
        }
      >
        <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
          <Form.Item
            label={t('AIModel.provider')}
            name="ai_model_provider"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'deepseek', label: 'DeepSeek' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label={t('AIModel.apiKey')}
            name="ai_model_api_key"
            rules={[{ required: true, message: t('AIModel.apiKeyRequired') }]}
          >
            <Input.Password
              placeholder="sk-xxxxxxxxxxxxxxxxxxxx"
              visibilityToggle
            />
          </Form.Item>

          <Form.Item
            label={t('AIModel.baseUrl')}
            name="ai_model_base_url"
            rules={[{ required: true }]}
          >
            <Input placeholder="https://api.deepseek.com/v1" />
          </Form.Item>

          <Form.Item
            label={t('AIModel.modelName')}
            name="ai_model_name"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'deepseek-chat', label: 'DeepSeek Chat (V3)' },
                { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner (R1)' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label={t('AIModel.temperature')}
            name="ai_model_temperature"
            tooltip={t('AIModel.temperatureTip')}
          >
            <Slider min={0} max={1} step={0.1} marks={{ 0: '0', 0.3: '0.3', 0.7: '0.7', 1: '1' }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={loading}
              >
                {t('AIModel.save')}
              </Button>
              <Button
                icon={<ApiOutlined />}
                onClick={handleTestConnection}
                loading={testing}
              >
                {t('AIModel.testConnection')}
              </Button>
              <Button
                icon={<WalletOutlined />}
                onClick={handleQueryBalance}
                loading={queryingBalance}
              >
                {t('AIModel.balanceQuery')}
              </Button>
            </Space>
          </Form.Item>

          {testResult && (
            <Alert
              showIcon
              type={testResult.success ? 'success' : 'error'}
              title={testResult.success ? t('AIModel.connectionSuccess') : t('AIModel.connectionFailed')}
              description={testResult.message}
              closable
              onClose={() => setTestResult(null)}
              style={{ marginTop: 8 }}
            />
          )}

          <BalanceAlert result={mainBalance} t={t} onClose={() => setMainBalance(null)} />

          {/* System Prompt 配置 */}
          <div style={{ marginTop: 24 }}>
            <Typography.Title level={5}>
              <Space>
                <FileTextOutlined />
                {t('AIModel.promptTitle')}
              </Space>
            </Typography.Title>
            <Typography.Text type="secondary" className="text-sm block mb-2">
              {t('AIModel.promptDescription')}
            </Typography.Text>
            <Form.Item name="ai_model_system_prompt" style={{ marginBottom: 8 }}>
              <Input.TextArea
                rows={20}
                placeholder={t('AIModel.promptPlaceholder')}
                className="font-mono text-sm"
              />
            </Form.Item>
            <Space>
              <Button
                icon={<UndoOutlined />}
                size="small"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/v1/ai-guide/config', { credentials: 'include' })
                    const json = await res.json()
                    const promptItem = json.data?.find((item: any) => item.config_key === 'ai_model_system_prompt')
                    if (promptItem?.config_value) {
                      form.setFieldValue('ai_model_system_prompt', promptItem.config_value)
                      message.info(t('AIModel.promptResetTip'))
                    }
                  } catch {
                    message.error('Failed to load default prompt')
                  }
                }}
              >
                {t('AIModel.promptReset')}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
      </BorderBeam>

      {/* AI 标签推荐配置 */}
      <Card
        title={
          <Space>
            <TagsOutlined />
            {t('AIModel.tagCardTitle')}
          </Space>
        }
      >
        <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
          <Form.Item
            label={t('AIModel.tagEnabled')}
            name="ai_tag_enabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Alert
            type="info"
            showIcon
            title={t('AIModel.tagFallbackTip')}
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            label={t('AIModel.tagBaseUrl')}
            name="ai_tag_base_url"
          >
            <Input placeholder={t('AIModel.tagBaseUrlPlaceholder')} />
          </Form.Item>

          <Form.Item
            label={t('AIModel.tagApiKey')}
            name="ai_tag_api_key"
          >
            <Input.Password
              placeholder={t('AIModel.tagApiKeyPlaceholder')}
              visibilityToggle
            />
          </Form.Item>

          <Form.Item
            label={t('AIModel.tagModel')}
            name="ai_tag_model"
          >
            <Input placeholder={t('AIModel.tagModelPlaceholder')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                icon={<ApiOutlined />}
                onClick={handleTagTestConnection}
                loading={tagTesting}
              >
                {t('AIModel.tagTestConnection')}
              </Button>
              <Button
                icon={<WalletOutlined />}
                onClick={handleQueryTagBalance}
                loading={queryingTagBalance}
              >
                {t('AIModel.balanceQuery')}
              </Button>
            </Space>
          </Form.Item>

          {tagTestResult && (
            <Alert
              showIcon
              type={tagTestResult.success ? 'success' : 'error'}
              title={tagTestResult.success ? t('AIModel.connectionSuccess') : t('AIModel.connectionFailed')}
              description={tagTestResult.message}
              closable
              onClose={() => setTagTestResult(null)}
              style={{ marginTop: 8 }}
            />
          )}

          <BalanceAlert result={tagBalance} t={t} onClose={() => setTagBalance(null)} />
        </Form>
      </Card>

      {/* AI 调用明细：每次调用的 token 消耗与估算金额 */}
      <Card
        title={
          <Space>
            <FileTextOutlined />
            {t('AIModel.usageCardTitle')}
          </Space>
        }
      >
        {usageSummary && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 mb-4 text-sm text-muted-foreground">
            <span>
              {t('AIModel.usageToday')}：
              <span className="font-medium text-foreground">{fmtNum(usageSummary.todayTokens)}</span> tokens / {usageSummary.todayRequests} {t('AIModel.usageRequestsUnit')}
            </span>
            <span>
              {t('AIModel.usageMonth')}：
              <span className="font-medium text-foreground">{fmtNum(usageSummary.monthTokens)}</span> tokens / {usageSummary.monthRequests} {t('AIModel.usageRequestsUnit')}
            </span>
            {usageCostEnabled && (
              <span>
                {t('AIModel.usageEstCost')}：
                <span className="font-medium text-foreground">{fmtCost(estCostOf(usageSummary.monthPromptTokens, usageSummary.monthCompletionTokens))}</span>
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-2 mb-2">
          <div>
            <div className="text-xs text-muted-foreground mb-1">{t('AIModel.usagePriceInput')}</div>
            <Input size="small" style={{ width: 180 }} value={priceInput} onChange={e => setPriceInput(e.target.value)} placeholder="2.0" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">{t('AIModel.usagePriceOutput')}</div>
            <Input size="small" style={{ width: 180 }} value={priceOutput} onChange={e => setPriceOutput(e.target.value)} placeholder="8.0" />
          </div>
          <Button size="small" icon={<SaveOutlined />} loading={savingPrice} onClick={handleSavePrice}>
            {t('AIModel.usagePriceSave')}
          </Button>
          <Button size="small" icon={<ReloadOutlined />} loading={usageLoading} onClick={fetchUsage}>
            {t('AIModel.usageRefresh')}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mb-4">{t('AIModel.usagePriceTip')}</div>

        <Table<AiUsageItem>
          size="small"
          rowKey="id"
          columns={usageColumns}
          dataSource={usageItems}
          loading={usageLoading}
          pagination={{ pageSize: 20, size: 'small', showSizeChanger: false, hideOnSinglePage: true }}
          locale={{ emptyText: t('AIModel.usageNoData') }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Card title={t('AIModel.usageTitle')} size="small">
        <ol className="list-decimal pl-6 space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>{t('AIModel.usage1')}</li>
          <li>{t('AIModel.usage2')}</li>
          <li>{t('AIModel.usage3')}</li>
          <li>{t('AIModel.usage4')}</li>
        </ol>
      </Card>
    </div>
  )
}
