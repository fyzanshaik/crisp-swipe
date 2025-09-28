import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: 'auto',
  endpoint: 'https://53dc217599ef32beec3aa6e54b0f6ce0.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = 'scripe-data';

export async function uploadFile(key: string, file: ArrayBuffer, contentType: string): Promise<string> {
  await client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: new Uint8Array(file),
    ContentType: contentType,
  }));
  return key;
}

export async function deleteFile(key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  }));
}

export async function getFile(key: string): Promise<ArrayBuffer> {
  const response = await client.send(new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  }));
  
  if (!response.Body) throw new Error('File not found');
  
  const chunks: Uint8Array[] = [];
  const reader = response.Body.transformToWebStream().getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result.buffer;
}

export function generateResumeKey(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `resumes/${userId}/${timestamp}-${cleanName}`;
}

export function isValidResumeType(contentType: string): boolean {
  return [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ].includes(contentType);
}
