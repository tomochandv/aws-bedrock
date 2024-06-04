import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime'
import { BedrockPromptInterface } from './interface'
import * as fs from 'fs'
import * as path from 'path'

const bedRockClient = new BedrockRuntimeClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'IAM 억세스키',
    secretAccessKey: 'IAM 비밀키',
  },
})
/**
 * bedrock 명령 실행
 * @param payload
 * @returns
 */
const commandBedrock = async (payload: BedrockPromptInterface) => {
  const command = new InvokeModelWithResponseStreamCommand({
    contentType: 'application/json',
    body: JSON.stringify(payload),
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  })
  const apiResponse = await bedRockClient.send(command)
  let completeMessage = ''
  for await (const item of apiResponse.body) {
    const chunk = JSON.parse(new TextDecoder().decode(item.chunk.bytes))
    const chunk_type = chunk.type
    if (chunk_type === 'content_block_delta') {
      const text = chunk.delta.text
      completeMessage = completeMessage + text
    }
  }
  return completeMessage
}

/**
 * 프롬프트 생성 및
 */
const run = async () => {
  const file = fs.readFileSync(path.join(__dirname, './0.jpeg'))
  const encode = Buffer.from(file).toString('base64')
  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: encode,
            },
          },
          {
            type: 'text',
            text: `- 이 이미지들은 모두 하나의 시약병 이미지.
        - 응답은 내가 지정해준 JSON 형식으로 해줘.
        - JSON의 VALUE 값은 내가 지정해준 값을 넣어줘.
        - JSON 형식은 ${JSON.stringify(json)}`,
          },
        ],
      },
    ],
  } as BedrockPromptInterface

  const response = await commandBedrock(payload)
  console.log(response)
}

const json = {
  product: '제조사 이름을 영어로 알려줘.',
  name: '제품명을 영어로 알려줘.',
}

run()
