import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "fs"
import path from "path"

export const ensureDirs = (dirs: string[]) => {
    dirs.forEach((dir) => mkdirSync(dir, { recursive: true }))
}

export const removeFiles = (paths: string[]) => {
    paths.forEach((p) => rmSync(p, { force: true }))
}

// conversations that time out or crash mid-way leave their downloads behind
export const sweepOldFiles = (dirs: string[], maxAgeMs: number) => {
    const cutoff = Date.now() - maxAgeMs

    dirs.filter((dir) => existsSync(dir)).forEach((dir) => {
        readdirSync(dir)
            .map((name) => path.join(dir, name))
            .filter((file) => statSync(file).mtimeMs < cutoff)
            .forEach((file) => rmSync(file, { force: true }))
    })
}
