import { ObjectEncodingOptions, PathLike } from 'fs'
import * as fs from 'fs/promises'

export function replaceEnv(str: string): string {
	return str.replace(/%([^%]+)%/g, (original, matched) => {
		const r = process.env[matched]
		return r ? r : ''
	})
}

export async function exists(path: string): Promise<boolean> {
	return await fs
		.access(path)
		.then(() => true)
		.catch(() => false)
}

export async function readdirSafe(path: string): Promise<string[] | undefined> {
	return await fs.readdir(path).catch(() => undefined)
}
