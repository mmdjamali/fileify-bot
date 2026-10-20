import { describe, expect, test } from "bun:test"
import { JobQueue } from "./job-queue"

const deferred = () => {
    let resolve!: () => void
    const promise = new Promise<void>((r) => resolve = r)
    return { promise, resolve }
}

describe("JobQueue", () => {
    test("runs at most `concurrency` jobs at once, in FIFO order", async () => {
        const queue = new JobQueue(2)
        const gates = [deferred(), deferred(), deferred(), deferred()]
        const started: number[] = []
        const positions: number[] = []

        const runs = gates.map((gate, idx) => queue.run(async () => {
            started.push(idx)
            await gate.promise
            return idx
        }, (position) => positions.push(position)))

        await Bun.sleep(0)
        expect(started).toEqual([0, 1])
        expect(positions).toEqual([1, 2])
        expect(queue.pending).toBe(2)

        gates[1].resolve()
        await Bun.sleep(0)
        expect(started).toEqual([0, 1, 2])

        gates.forEach((gate) => gate.resolve())
        expect(await Promise.all(runs)).toEqual([0, 1, 2, 3])
        expect(queue.pending).toBe(0)
    })

    test("frees the slot when a job fails", async () => {
        const queue = new JobQueue(1)

        await expect(queue.run(async () => { throw new Error("boom") })).rejects.toThrow("boom")
        expect(await queue.run(async () => "next")).toBe("next")
    })

    test("keeps the queued job when the onQueued callback throws", async () => {
        const queue = new JobQueue(1)
        const gate = deferred()

        const first = queue.run(() => gate.promise)
        const second = queue.run(async () => "ran", () => { throw new Error("telegram is down") })

        gate.resolve()
        await first
        expect(await second).toBe("ran")
    })
})
