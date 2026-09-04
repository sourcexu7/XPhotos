'use client'

import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Select, Slider, Card, Space, App, Alert, Typography } from 'antd'
import { RobotOutlined, ApiOutlined, SaveOutlined, FileTextOutlined, UndoOutlined } from '@ant-design/icons'
import AdminPageHeader from '~/components/admin/layout/page-header'
import { useTranslations } from 'next-intl'

interface AIConfig {
  config_key: string
  config_value: string
  hasKey?: boolean
}

export default function AIModelSettings() {
  const { message } = App.useApp()
  const t = useTranslations()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetchConfig()
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
      })
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
            </Space>
          </Form.Item>

          {testResult && (
            <Alert
              showIcon
              type={testResult.success ? 'success' : 'error'}
              message={testResult.success ? t('AIModel.connectionSuccess') : t('AIModel.connectionFailed')}
              description={testResult.message}
              closable
              onClose={() => setTestResult(null)}
              style={{ marginTop: 8 }}
            />
          )}

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
