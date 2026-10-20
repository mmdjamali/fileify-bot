export type Size = { width: number, height: number }

// accepts "512x512", "512x" / "x512" (keep aspect ratio) and "50%"
export const parseSize = (input: string, current: Size): Size | null => {
    const text = input.trim().toLowerCase()

    const percent = text.match(/^(\d+(?:\.\d+)?)%$/)
    if (percent) {
        const ratio = parseFloat(percent[1]) / 100
        return valid({ width: Math.round(current.width * ratio), height: Math.round(current.height * ratio) })
    }

    const match = text.match(/^(\d*)x(\d*)$/)
    if (!match || (!match[1] && !match[2])) return null

    const width = match[1] ? parseInt(match[1]) : undefined
    const height = match[2] ? parseInt(match[2]) : undefined

    return valid({
        width: width ?? Math.round(current.width * height! / current.height),
        height: height ?? Math.round(current.height * width! / current.width),
    })
}

const valid = (size: Size) => size.width > 0 && size.height > 0 ? size : null
