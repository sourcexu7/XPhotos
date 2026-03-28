/**
 * 设置相关 API 服务
 */

import { apiClient } from '../client'
import type { ApiResponse } from '../client'

/**
 * S3 验证结果
 */
export interface S3ValidationResult {
  bucket: string
  endpoint: string
  checks: {
    headBucket: string
    putObject: string
    getObject: string
    deleteObject: string
  }
}

/**
 * COS 验证结果
 */
export interface COSValidationResult {
  bucket: string
  endpoint: string
  checks: {
    headBucket: string
    putObject: string
    getObject: string
    deleteObject: string
  }
}

/**
 * 验证 S3 配置
 */
export async function validateS3(): Promise<ApiResponse<S3ValidationResult>> {
  return apiClient.get('/settings/validate-s3')
}

/**
 * 验证 COS 配置
 */
export async function validateCOS(): Promise<ApiResponse<COSValidationResult>> {
  return apiClient.get('/settings/validate-cos')
}
