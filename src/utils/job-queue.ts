// Limits how many CPU-heavy jobs (ffmpeg, sharp) run at once; the rest wait in FIFO order
export class JobQueue {
    private running = 0
    private waiting: (() => void)[] = []

    constructor(private readonly concurrency: number) { }

    get pending() {
        return this.waiting.length
    }

    async run<T>(job: () => Promise<T>, onQueued?: (position: number) => unknown): Promise<T> {
        if (this.running < this.concurrency) {
            this.running++
        } else {
            const turn = new Promise<void>((resolve) => this.waiting.push(resolve))

            // a failing notification must not lose our place, or the slot handed to us would leak
            try {
                await onQueued?.(this.waiting.length)
            } catch { }

            await turn
        }

        try {
            return await job()
        } finally {
            const next = this.waiting.shift()

            // hand the slot straight to the next job instead of releasing it
            if (next) next()
            else this.running--
        }
    }
}
