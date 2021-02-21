const utils = require('util');
const path = require('path');
const EJS = require('ejs');
const NodeSass = require('node-sass');
const JSON5 = require('json5');
const semver = require('semver');
const Bunbun = require('bunbun');
const Prism = require('prismjs');
const PrismLoadLanguages = require('prismjs/components/');

PrismLoadLanguages([
    'typescript',
    'javascript',
    'jsx',
    'tsx',
]);

const hlTs = (text, filename = false) => {

    const file = filename === false
        ? ''
        : `<div class="filename">${filename}</div>`;

    const src = Prism.highlight(text, Prism.languages.tsx, 'tsx');
    return `<pre class="codeblock">${file}<code class="language-tsx">${src}</code></pre>`;
};

// --- Utils

const renderSass = utils.promisify(NodeSass.render);
const renderEJS = utils.promisify(EJS.renderFile);

// --- Bunbun

const $ = new Bunbun();

const getAssetPath = file => `${__dirname}/docs/assets/${file}`;

const buildEjs = async (data, resultFile, ...files) => {
    data.name = files[0];

    const html = await renderEJS(
        './docs/ejs/_template.ejs',
        {
            data: Object.assign({}, data, { includeFiles: files, getAssetPath }),
        },
        {
            root: './docs/ejs',
            context: {
                hl: {
                    ts: hlTs,
                },
            },
        },
    );

    const result = `./docs/${resultFile}.html`;
    const baseFile = path.dirname(result);

    await $.fs.createDir(baseFile);
    await $.fs.write(result, html);
};

const getEjsFilenames = async pattern => {
    const files = await $.rescue($.fs.list(`./docs/ejs/${pattern}.ejs`), []);
    return files.map(x => path.basename(x, '.ejs'));
};

const forAll = async (promise, fn) => {
    const result = await promise;
    return await Promise.all(result.map(x => fn(x)));
};

$.task('docs:build/ejs', async () => {
    const dataRaw = await $.fs.read('./docs/ejs/_data.json5');
    const data = await $.rescue(JSON5.parse(dataRaw), {});

    data.versions = data.versions
        .sort((a, b) => semver.gt(a, b) ? 1 : -1);

    const latestVersion = data.versions[0];

    // prepare dirs
    await $.fs.createDir(`./docs/changelog`);

    // create every flat files
    ['index', 'sponsoring'].map(x => buildEjs(data, x, x));

    // create every changelog file
    await forAll(
        getEjsFilenames('changelog/*'),
        x => buildEjs(data, `changelog/${x}`, 'changelog', `changelog/${x}.ejs`)
    );

    // each version files
    for (const v of data.versions) {
        const resultPrefix = `${latestVersion === v ? '' : `${v}/`}`;

        if (resultPrefix !== '') {
            await $.fs.createDir(`./docs/${v}`);
        }

        await forAll(
            getEjsFilenames(`${v}/philosophy/*`),
            x => buildEjs(data, `${resultPrefix}philosophy/${x}`, 'philosophy', `${v}/philosophy/${x}.ejs`)
        );

        await forAll(
            getEjsFilenames(`${v}/docs/*`),
            x => buildEjs(data, `${resultPrefix}docs/${x}`, 'docs', `${v}/docs/${x}.ejs`)
        );
    }
});

$.task('docs:build/scss', async () => {
    const result = await renderSass({
        file: './docs/scss/index.scss',
        sourceMap: './index.css.map',
        outFile: './index.css',
        outputStyle: 'compressed',
        sourceMapContents: true,
    });
    await $.fs.write('./docs/index.css', result.css || '');
    await $.fs.write('./docs/index.css.map', result.map || '');
});

$.task('docs:build', async () => {
    await $.run('docs:build/scss');
    await $.run('docs:build/ejs');
});

$.task('docs:watch', async () => {
    const server = $.serve('./docs', 8080);

    $.fs.watch(`./docs/**/*.(html|css|js)`, async () => {
        server.reload();
    });

    $.fs.watch(`./docs/**/*.(ejs|scss|tsx|ts)`, async () => {
        await $.run('docs:build');
    });
});

$.start();
