import { expect, test } from "bun:test"
import { parseSize } from "./parse-size"

const current = { width: 1000, height: 500 }

test("exact size", () => {
    expect(parseSize("512x256", current)).toEqual({ width: 512, height: 256 })
    expect(parseSize(" 512X256 ", current)).toEqual({ width: 512, height: 256 })
})

test("one side keeps the aspect ratio", () => {
    expect(parseSize("500x", current)).toEqual({ width: 500, height: 250 })
    expect(parseSize("x100", current)).toEqual({ width: 200, height: 100 })
})

test("percentage", () => {
    expect(parseSize("50%", current)).toEqual({ width: 500, height: 250 })
    expect(parseSize("12.5%", current)).toEqual({ width: 125, height: 63 })
})

test("rejects invalid input", () => {
    for (const input of ["", "x", "abc", "512", "0x100", "-5x5", "0%", "512x512x2"]) {
        expect(parseSize(input, current)).toBeNull()
    }
})
