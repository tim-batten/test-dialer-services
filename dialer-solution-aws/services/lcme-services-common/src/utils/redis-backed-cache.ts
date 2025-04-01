import { ChainableCommander } from "ioredis"

export class RedisBackedCache<T> {
  cached?: T
  lastGetTime: number

  constructor(private maxAge: number, private getter: (pipeline: ChainableCommander | undefined) => Promise<T | undefined>) {
      this.lastGetTime = 0
  }

  async get(pipeline?: ChainableCommander) {
      const now = Date.now()
      if (!this.cached || now > (this.lastGetTime + this.maxAge)) {
          await this.refresh(pipeline)
      }
      return this.cached
  }

  private async refresh(pipeline: ChainableCommander | undefined) {
      const now = new Date().getTime()
      const newValue = await this.getter(pipeline)
      if (newValue) {
          this.cached = newValue
      }
      this.lastGetTime = now
  }

}