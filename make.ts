import Bunbun from 'bunbun';
import Fs from 'fs';
import Path from 'path';
import Ejs from 'ejs';
import Lru from 'lru-cache';
import Sass from 'node-sass';
import Cheerio from 'cheerio';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';

const $ = new Bunbun();

Ejs.cache = new Lru(150);

const context = {
    url: (name?: string) => `https://${name ? `${name}.` : ''}nodi.dev/`,
    code: (path: string, filename?: string) => {
        filename = filename ? `<div class="filename">${filename}</div>` : '';
        const data = Fs.readFileSync(`${__dirname}/src/${path}`, 'utf-8');
        const ext = Path.extname(path).replace('.', '');
        const code = Prism.highlight(data, Prism.languages[ext], ext);
        return `<pre class="codeblock">${filename}<code class="language-${ext}">${code}</code></pre>`;
    },
};

const loadingFunc = () => {
    window.addEventListener('load', () => {
        document.body.removeAttribute('data-is-loading');
    });
};

$.task('build', async () => {
    const files = await $.fs.list('./src/**/*.*');

    for (const file of files) {
        const ext = Path.extname(file);
        const basename = Path.basename(file, ext);

        if (basename.startsWith('_') || file.includes('/src/assets/')) {
            continue;
        }

        let resultFile: string;

        switch (ext) {
            case '.ejs':
                const ejs = await $.fs.read(file);
                const html = Ejs.render(ejs, {}, {
                    context,
                    root: `${__dirname}/src`,
                });
                const dom = Cheerio.load(html);
                dom('body').attr('data-is-loading', 'true');
                dom('head').append(`<script>(${loadingFunc})();</script>`);
                resultFile = file
                    .replace('\\', '/')
                    .replace('.ejs', '.html')
                    .replace('/src/', '/build/');
                await $.fs.createDir(Path.dirname(resultFile));
                await $.fs.write(resultFile, dom.html());
                break;

            case '.scss':
                const scss = Sass.renderSync({
                    file,
                    outputStyle: 'compressed',
                    functions: {
                        'to-base64($url, $mime: "image/png")': (($url: Sass.types.Value, $mime: Sass.types.Value) => {
                            if (!($url instanceof Sass.types.String)) {
                                throw '$url: Expected string.';
                            }

                            if (!($mime instanceof Sass.types.String)) {
                                throw '$mime: Expected string.';
                            }

                            const content = Fs.readFileSync(Path.join(__dirname, 'src', $url.getValue()));
                            const base64 = Buffer.from(content).toString('base64');
                            return new Sass.types.String(`data:${$mime.getValue()};base64,${base64}`);
                        }),
                    },
                });
                resultFile = file
                    .replace('\\', '/')
                    .replace('.scss', '.css')
                    .replace('/src/', '/build/');
                await $.fs.createDir(Path.dirname(resultFile));
                await $.fs.write(resultFile, scss.css);
                break;

            default:
                resultFile = file
                    .replace('\\', '/')
                    .replace('/src/', '/build/');
                await $.fs.copy(file, resultFile);
                break;
        }


    }
});

$.task('watch', async () => {
    await $.run('build');

    $.fs.watch(`./src/**/*.*`, async () => {
        await $.run('build');
    });
});

$.start();
