import { compare } from 'compare-versions'
import { spawn } from 'node:child_process'
import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises'
import { arch, platform } from 'os'
import pathjs from 'path'
import { terminal as $ } from 'terminal-kit'
import { checkArgs, customSpinner, exists, getEnvironmentFiles, isOnline, log } from './util'

const RELEASES_API_URL = 'https://api.github.com/repos/JannisX11/Blockbench/releases'
const RELEASE_TAGS_URL = RELEASES_API_URL + '/tags'
const LATEST_RELEASE_URL = RELEASES_API_URL + '/latest'
const MINIMUM_BLOCKBENCH_VERSION: ResolvedBlockbenchVersion = '4.10.0'

export type NamedBlockbenchVersion = 'latest' | 'beta' | `${'v' | ''}${number}.${number}.${number}`
export type ResolvedBlockbenchVersion = `${number}.${number}.${number}`

function getNameProvider() {
	switch (platform()) {
		case 'win32':
			return (version: ResolvedBlockbenchVersion) => [
				`https://github.com/JannisX11/blockbench/releases/download/v${version}/Blockbench_${version}_portable.exe`,
				`blockbench-${version}.exe`,
			]
		case 'darwin':
			return (version: ResolvedBlockbenchVersion) => [
				`https://github.com/JannisX11/blockbench/releases/download/v${version}/Blockbench_${arch}_${version}.dmg`,
				`blockbench-${version}.dmg`,
			]
		case 'linux':
		default:
			return (version: ResolvedBlockbenchVersion) => [
				`https://github.com/JannisX11/blockbench/releases/download/v${version}/Blockbench_${arch}_${version}.AppImage`,
				`blockbench-${version}.AppImage`,
			]
	}
}
const urlProvider = getNameProvider()

async function resolveVersion(version: NamedBlockbenchVersion) {
	if (version === undefined) {
		throw new Error('No version specified!')
	} else if (version === 'latest') {
		version = await getLatestBlockbenchVersion()
	} else if (version === 'beta') {
		version = await getLatestBetaBlockbenchVersion()
	}
	return (version.startsWith('v') ? version.slice(1) : version) as ResolvedBlockbenchVersion
}

/**
 * Downloads the Blockbench version specified to the target directory
 * @param target The directory to download the file into
 * @param version The version of Blockbench to download
 * @param fileName The name of the file to save as. Supports {version} as a placeholder for the version
 * @returns The path to the downloaded file
 */
async function downloadNewPortableBlockbench(version: ResolvedBlockbenchVersion) {
	if (!isOnline()) {
		throw new Error('You are offline, so we cannot download Blockbench!\n')
	}

	if (await isVersionInstalled(version)) {
		throw new Error(
			`Attemped to install Blockbench version ${version}, but it is already installed!`
		)
	}
	const target = getPortablePath(version)
	const [url] = urlProvider(version)
	await customSpinner({
		style: $.cyan,
		prefix: log,
		suffix: $.cyan.bindArgs(' Downloading Blockbench...'),
		async waitFor() {
			const res = await fetch(url)
			if (!res.ok) {
				log().error.red(
					`Failed to download Blockbench ${version}: The requested version does not include a portable executable, therefore envbench cannot safely isolate it.\n`
				)
				throw new Error(
					`Failed to download Blockbench ${version} from ${url}: ${res.statusText}`
				)
			}
			await mkdir(pathjs.parse(target).dir, { recursive: true })
			await writeFile(target, Buffer.from(await res.arrayBuffer()))
		},
	})
	log().green('Blockbench downloaded successfully!\n')

	return target
}

function getPortablePath(version: ResolvedBlockbenchVersion) {
	return pathjs.join(process.env.BLOCKBENCH_PORTABLES_CACHE, urlProvider(version)[1])
}

export async function isValidBlockbenchVersion(version: NamedBlockbenchVersion) {
	if (!isOnline()) {
		log().yellow(
			'You are offline, so we cannot validate the version of Blockbench this Environment uses.\n'
		)
		return true
	}
	version = await resolveVersion(version)
	const prefixedVersion = `v${version}`

	if (compare(version, MINIMUM_BLOCKBENCH_VERSION, '<')) {
		log().red(
			`Blockbench ${prefixedVersion} is not supported by envbench, as it does not allow changing the userData folder. Please use version v${MINIMUM_BLOCKBENCH_VERSION} or later.\n`
		)
		return false
	}

	const res = await fetch(RELEASE_TAGS_URL + '/' + prefixedVersion)
	if (!res.ok) {
		return false
	}
	const json = await res.json()

	return json.tag_name === prefixedVersion
}

async function getLatestBlockbenchVersion() {
	const res = await fetch(LATEST_RELEASE_URL)
	if (!res.ok) throw new Error(`Failed to fetch latest Blockbench release: ${res.statusText}`)
	const json = await res.json()
	return json.tag_name as NamedBlockbenchVersion
}

async function getLatestBetaBlockbenchVersion() {
	const res = await fetch(RELEASES_API_URL)
	if (!res.ok) throw new Error(`Failed to fetch Blockbench releases: ${res.statusText}`)
	const json = await res.json()
	const betaRelease = json.find((release: any) => release.prerelease)
	if (!betaRelease) throw new Error('No beta release found!')
	return betaRelease.tag_name as NamedBlockbenchVersion
}

async function isVersionInstalled(version: NamedBlockbenchVersion) {
	version = await resolveVersion(version)
	const path = getPortablePath(version)
	const portableInstalled = await exists(path)
	if (portableInstalled) return true
	return false
}

export async function installVersion(
	version: NamedBlockbenchVersion,
	ignoreAlreadyInstalledError = true
) {
	version = await resolveVersion(version)
	if (await isVersionInstalled(version)) {
		if (ignoreAlreadyInstalledError) {
			return
		} else {
			throw new Error(`Blockbench ${version} is already installed!`)
		}
	}
	await downloadNewPortableBlockbench(version)
}

export async function runBlockbench(
	version: NamedBlockbenchVersion,
	environmentName: string,
	args: string[] = []
) {
	const resolvedVersion = await resolveVersion(version)

	if (!(await isVersionInstalled(version))) {
		await downloadNewPortableBlockbench(resolvedVersion)
	}

	let blockbenchPath = process.env.BLOCKBENCH_PATH
	const latest = await resolveVersion('latest')
	if (version !== latest) {
		blockbenchPath = getPortablePath(resolvedVersion)
	}

	checkArgs(args)
	const userDataFolder = pathjs.join(process.env.ENVBENCH_STORAGE_FOLDER, environmentName)
	args = ['--userData', userDataFolder, ...args]

	return new Promise<void>((resolve, reject) => {
		const bb = spawn(blockbenchPath, args, { shell: false })
			.on('error', err => {
				log().red('Failed to launch Blockbench:\n', err.message, '\n')
				process.exit(1)
			})
			.on('spawn', () => {
				log().green('Blockbench launched successfully!\n')
			})
			.on('exit', code => {
				if (code === 0) {
					resolve()
				} else {
					reject(new Error('Blockbench exited with code: ' + code))
				}
			})
		bb.stdout.on('data', data => {
			$(data)
		})
	})
}

export async function getInstalledVersions() {
	const portableFiles = await readdir(process.env.BLOCKBENCH_PORTABLES_CACHE)
	return portableFiles.map(file =>
		file.replace(/^blockbench-|\.exe|\.dmg|\.AppImage$/g, '')
	) as ResolvedBlockbenchVersion[]
}

export async function pruneBlockbenchVersions() {
	const environments = await getEnvironmentFiles()
	const installedVersions = await getInstalledVersions()
	const versionsInUse = new Set<ResolvedBlockbenchVersion>()
	for (const envFile of Object.values(environments)) {
		if (envFile === undefined) continue
		versionsInUse.add(await resolveVersion(envFile.blockbench_version))
	}

	for (const version of installedVersions) {
		if (!versionsInUse.has(version)) {
			log().red(`Removing Blockbench version `).cyan(version).red(`...\n`)
			await unlink(getPortablePath(version))
		}
	}
}
