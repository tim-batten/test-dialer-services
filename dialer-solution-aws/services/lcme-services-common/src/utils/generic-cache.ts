export class GenericCache<T> {
    cached?: T
    lastGetTime: number

    constructor(private maxAge: number, private getter: () => Promise<T | undefined>) {
        this.lastGetTime = 0
    }

    async get() {
        const now = Date.now()
        if (!this.cached || now > (this.lastGetTime + this.maxAge)) {
            await this.refresh()
        }
        return this.cached
    }

    async refresh() {
        const now = new Date().getTime()
        const newValue = await this.getter()
        if (newValue) {
            this.cached = newValue
        }
        this.lastGetTime = now
    }

}