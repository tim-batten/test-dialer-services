export interface RedisStreamMessageListener {
    handleStreamMessage(messageId: number, streamMessage: any, receivedAt: Date): void
}