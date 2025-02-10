import chalk from 'chalk'
import { Command } from 'commander'
import ESBuild from 'esbuild'
import ImportGlobPlugin from 'esbuild-plugin-import-glob'
import * as fs from 'fs'

const PROGRAM = new Command()

PROGRAM.name('esbuild-tool')
	.option('--dev', 'Build in development mode.')
	.description('A tool for building esbuild projects.')
	.parse()
const OPTIONS = PROGRAM.opts()

if (OPTIONS.dev === true) {
	process.env.NODE_ENV = 'development'
} else {
	process.env.NODE_ENV = 'production'
}

process.env.FLAVOR ??= `local`

const PACKAGE = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

const INFO_PLUGIN: ESBuild.Plugin = {
	name: 'infoPlugin',
	setup(build) {
		let start = Date.now()
		build.onStart(() => {
			console.log('🔨 Building...')
			start = Date.now()
		})

		build.onEnd(result => {
			const end = Date.now()
			const diff = end - start
			let message = chalk.green(`✅ Built in ${diff}ms`)
			if (result.errors.length > 0) {
				message += chalk.gray(
					` | ${chalk.red(result.errors.length)} ${chalk.red(
						'error' + (result.errors.length ? '' : 's')
					)}`
				)
			}
			if (result.warnings.length > 0) {
				message += chalk.gray(
					` | ${chalk.yellow(result.warnings.length)} ${chalk.yellow(
						'warning' + (result.warnings.length ? '' : 's')
					)}`
				)
			}
			console.log(message)
			if (process.env.NODE_ENV === 'development') {
				console.log(chalk.gray('👀 Watching for changes...'))
			}
		})
	},
}

function createHeader() {
	const license = fs.readFileSync('./LICENSE').toString()
	let lines: string[] = [
		`v${PACKAGE.version as string}` + (process.env.NODE_ENV === 'development' ? ' [DEV]' : ''),
		``,
		PACKAGE.description,
		``,
		`Created by ${PACKAGE.author.name as string}`,
		`(${PACKAGE.author.email as string}) [${PACKAGE.author.url as string}]`,
		``,
		`[ SOURCE ]`,
		`${PACKAGE.repository.url as string}`,
		``,
		`[ LICENSE ]`,
		...license.split('\n').map(v => v.trim()),
	]

	const maxLength = Math.max(...lines.map(line => line.length))
	const leftBuffer = Math.floor(maxLength / 2)
	const rightBuffer = Math.ceil(maxLength / 2)

	const header = '╭' + `─`.repeat(maxLength + 2) + '╮'
	const footer = '╰' + `─`.repeat(maxLength + 2) + '╯'

	lines = lines.map(v => {
		const div = v.length / 2
		const l = Math.ceil(leftBuffer - div)
		const r = Math.floor(rightBuffer - div)
		return '│ ' + ' '.repeat(l) + v + ' '.repeat(r) + ' │'
	})

	const banner =
		'#!/usr/bin/env node\n' + [header, ...lines, footer].map(v => `//?? ${v}`).join('\n') + '\n'

	return {
		js: banner,
	}
}

const DEFINES: Record<string, string> = {}

Object.entries(process.env).forEach(([key, value]) => {
	if (/[^A-Za-z0-9_]/i.exec(key)) return
	DEFINES[`process.env.${key}`] = JSON.stringify(value)
})

const DEFAULT_BUILD_OPTIONS: ESBuild.BuildOptions = {
	get banner() {
		return createHeader()
	},
	entryPoints: ['./src/index.ts'],
	outfile: `./dist/${PACKAGE.name as string}.js`,
	bundle: true,
	minify: false,
	sourcemap: 'inline',
	platform: 'node',
	loader: {
		'.svg': 'dataurl',
		'.ttf': 'binary',
		'': 'text', // Fix for terminal-kit's README being loaded as JavaScript
	},
	plugins: [INFO_PLUGIN, ImportGlobPlugin()],
	define: DEFINES,
	external: ['terminal-kit'],
	treeShaking: true,
}

async function buildDev() {
	const ctx = await ESBuild.context({ ...DEFAULT_BUILD_OPTIONS })
	await ctx.watch()
}

function buildProd() {
	ESBuild.build({
		...DEFAULT_BUILD_OPTIONS,
		minify: true,
		// Disabling this will reduce file size, but make bugs much harder to track down.
		keepNames: true,
		drop: ['debugger'],
	}).catch(() => process.exit(1))
}

async function main() {
	if (process.env.NODE_ENV === 'development') {
		await buildDev()
		return
	}
	buildProd()
}

void main()
