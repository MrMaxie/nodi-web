import Bunbun from 'bunbun';
import Fs from 'fs';
import Path from 'path';
import Ejs from 'ejs';
import Sass from 'node-sass';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';

const $ = new Bunbun();

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

Ejs.resolveInclude = (_: string, path: string) => Fs.readFileSync(`${__dirname}/src/${path}`, 'utf-8');

$.task('build', async () => {
    const files = await $.fs.list('./src/**/*.(ejs|scss)');

    for (const file of files) {
        const ext = Path.extname(file);
        const basename = Path.basename(file, ext);

        if (basename.startsWith('_')) {
            continue;
        }

        let resultFile: string;

        switch (ext) {
            case '.ejs':
                const ejs = await $.fs.read(file);
                const html = await Ejs.render(ejs, {}, {
                    async: true,
                    context,
                });
                resultFile = file
                    .replace('\\', '/')
                    .replace('.ejs', '.html')
                    .replace('/src/', '/build/');
                await $.fs.createDir(Path.dirname(resultFile));
                await $.fs.write(resultFile, html);
                break;

            case '.scss':
                const scss = Sass.renderSync({
                    file,
                    outputStyle: 'compressed',
                });
                resultFile = file
                    .replace('\\', '/')
                    .replace('.scss', '.css')
                    .replace('/src/', '/build/');
                await $.fs.createDir(Path.dirname(resultFile));
                await $.fs.write(resultFile, scss.css);
                break;
        }


    }
});

$.task('watch', async () => {
    const server = $.serve('./build', 80);

    await $.run('build');

    $.fs.watch(`./docs/**/*.*`, async () => {
        await $.run('build');
        server.reload();
    });
});

$.start();
