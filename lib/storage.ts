import 'server-only';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { fetchConfigsByKeys } from '~/lib/db/query/configs';
import { getClient } from '~/lib/s3';
import { getR2Client } from '~/lib/r2';
import ExifReader from 'exifreader';
import type { Image, Config } from '~/types';
import { Readable } from 'stream';

function detectStorageByUrl(url: string): 's3' | 'r2' | 'alist' | 'local' {
    if (!url) return 's3'; // Default
    const lower = url.toLowerCase();
    if (lower.includes('.r2.') || lower.includes('.r2.dev') || lower.includes('r2.cloudflarestorage')) {
        return 'r2';
    }
    if (lower.includes('alist')) { // A simple check, might need refinement
        return 'alist';
    }
    if (lower.startsWith('/')) {
        return 'local';
    }
    return 's3';
}

function getKeyFromImage(image: { id: string; url: string; original_key: string | null }): string | null {
    if (image.original_key) {
        return image.original_key.startsWith('/') ? image.original_key.slice(1) : image.original_key;
    }
    try {
        const url = new URL(image.url);
        return decodeURIComponent(url.pathname.slice(1));
    } catch (e) {
        console.error(`Invalid URL for image ID ${image.id}: ${image.url}`);
        return null;
    }
}

export async function streamImage(imageMeta: Image): Promise<{ stream: Readable; exif: null }> {
    const storageType = detectStorageByUrl(imageMeta.url);
    
    // For non-S3/R2 storage, we buffer the whole file
    if (storageType !== 's3' && storageType !== 'r2') {
        console.log(`Buffering download for storage type: ${storageType}`);
        const response = await fetch(imageMeta.url);
        if (!response.ok) throw new Error(`Failed to fetch image from ${imageMeta.url}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);
        // NOTE: EXIF reading is disabled for simplicity and stability in this version
        return { stream, exif: null };
    }

    // S3/R2 true streaming logic
    const key = getKeyFromImage(imageMeta);
    if (!key) {
        throw new Error(`Could not determine file key for image ID ${imageMeta.id}`);
    }

    const configs = await fetchConfigsByKeys([
        'accesskey_id', 'accesskey_secret', 'region', 'endpoint', 'bucket',
        'r2_accesskey_id', 'r2_accesskey_secret', 'r2_account_id', 'r2_bucket',
    ]);

    const toConfigMap = (configs: Config[]) => configs.reduce((map, c) => {
        if (c.config_key) map[c.config_key] = c.config_value || '';
        return map;
    }, {} as Record<string, string>);

    const configMap = toConfigMap(configs);
    
    const client = storageType === 's3' ? getClient(configs) : getR2Client(configs);
    const bucket = storageType === 's3' ? configMap['bucket'] : configMap['r2_bucket'];

    if (!client || !bucket) {
        throw new Error(`Storage client or bucket not configured for ${storageType}`);
    }

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await client.send(command);

    if (!response.Body || !(response.Body instanceof Readable)) {
        throw new Error('S3/R2 response body is not a readable stream.');
    }
    
    // Directly return the stream from S3/R2
    // NOTE: EXIF reading is disabled for simplicity and stability in this version
    return { stream: response.Body, exif: null };
}
