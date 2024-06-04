export interface ImagePromptInterface {
  type: string
  source: {
    type: string
    media_type: string
    data: string
  }
}

export interface TextPromptInterface {
  type: string
  text: string
}

export interface BedrockPromptInterface {
  anthropic_version: string
  max_tokens: number
  messages: [
    {
      role: string
      content: Array<ImagePromptInterface | TextPromptInterface>
    },
  ]
}
