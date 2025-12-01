'use client'

import React from 'react'
import { Card } from 'antd'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function AntdChart({ data, dataKey = 'value', name = '数值' }: { data: any[]; dataKey?: string; name?: string }) {
  return (
    <Card>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke="#1890ff" name={name} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
