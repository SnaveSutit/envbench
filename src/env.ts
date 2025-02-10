import * as pathjs from 'path'
import { expandEnv } from './util'

declare global {
	namespace NodeJS {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		export interface ProcessEnv {
			BLOCKBENCH_PATH: string
			BLOCKBENCH_DEFUALT_USER_DATA: string
			ENVBENCH_STORAGE_FOLDER: string
			ENVBENCH_ENVIRONMENT_FILE: string
			BLOCKBENCH_PORTABLES_CACHE: string
		}
	}
}

process.env.BLOCKBENCH_PATH ??= pathjs.normalize(
	expandEnv('%LOCALAPPDATA%/Programs/Blockbench/Blockbench.exe')
)
process.env.BLOCKBENCH_DEFUALT_USER_DATA ??= pathjs.normalize(expandEnv('%APPDATA%/Blockbench/'))
process.env.ENVBENCH_STORAGE_FOLDER ??= pathjs.normalize(expandEnv('%APPDATA%/EnvBench'))
process.env.ENVBENCH_ENVIRONMENT_FILE ??= '.envbench.json'
process.env.BLOCKBENCH_PORTABLES_CACHE ??= pathjs.join(
	process.env.ENVBENCH_STORAGE_FOLDER,
	'.portables'
)
