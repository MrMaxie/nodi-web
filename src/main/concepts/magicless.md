---
title: Magicless
order: 10
---

<div class="illus"><%- include('/assets/illus/undraw-magic.svg') %></div>

# Magicless

One of the main purpose of the project is forbidden magic. Magic itself can be useful in some cases and we just try to create border of usefulness and reliability of just magic.

> *Magic* in programming can be term for many things. For us *Magic code* means non-transparent code - code that create unforeseen result, hard to understand side-effect etc.

Magic can do multiple things, provie many features and side-effects. We need to consider types of such magic.

## 1. Side-effects

In this example we can see how side-effects can be destructive:

```tsx
const decorateAnchors = () => {
    Array.from(document.querySelectorAll('a')).forEach(el => {
        el.innerText += '?';
        el.style.color = 'red';
    });
};

// somewhere else

decorateAnchors();

const iterator = document.evaluate("//a[text()='Home']", document, null, XPathResult.ANY_TYPE, null);
const element = iterator.iterateNext();
console.log(element); // why null?!
```

But are they always bad? What can be named as "side-effect" and what cannot be? It's pretty hard to tell when something will become a side-effect, beacuse in practice every piece of code can change DOM or other global scoped things. We cannot avoid side-effects in that meaning, but making code more related allows us control such things. Consider such alternative:

```tsx
const decorateAnchors = (anchors: HTMLElement[]) => {
    anchors.forEach(el => {
        el.innerText += '?';
        el.style.color = 'red';
    });
};

// somewhere else

const anchor = document.querySelector('a');
decorateAnchors([anchor]);
console.log(anchor); // our anchor is safe :)
```

Relating things allows us make code safer.

## 2. Non-obvious result

Let's consider such configuration file:

```json
{
    "mode": "development",
    "entry": "./foo.*.js",
    ":do-export": true,
    "output": {
        "path": "dist",
        "filename": "foo.$s.bundle.js"
    }
}
```

And let's think about result of this configuration file... What the heck is going on here? We can only speculate what that means, but we can't found source code of those things, because JSON format is not for humans at very end. One of the most important principles of programming is that code is mostly for humans. Configurations are just bad, but we cannot avoid them in some cases, e.g:
- end-user applications settings
- closed source applications settings
- non language specific things

All other programming things have to be programmable and possible typed, because it's only way to check source of things and understand how they works and/or get syntax errors instead of weird, unexpected effects of such configuration running.

## 3. Dynamic code parts

Metaprogramming is powerful way to do awesome things. Avoiding this kind of code preparation makes code too much human-related for no reason. There are many things which can be done automatically.

```tsx
// index.ts

export { Name1 } from './Name1.tsx';
export { Name2 } from './Name2.tsx';
export { Namc3 } from './Name3.tsx';
// and so on
```

Why even people have to write such files? First of all - it can generate some error. Humans are not perfect, and for example typos can break things, like in 3rd export above. How can we describe such this file in other way?

```tsx
// index.ts

export { $1 } from './.*?/(.*?).tsx';
```

Ok, so we have short version of code, but well, it's invalid file. How can valid file looks like?

```tsx
// macros.ts

Macro.register('glob-export', (context: MacroContext) => {
    const dir = path.dirname(context.filename);
    return glob(`${dir}/*.tsx`)
        .map(file => {
            const name = path.basename(file, '.tsx');
            return `export { ${name} } from './${name}.tsx';\n`;
        })
        .join('');
});

// index.ts

//!macro-exec:glob-export()
    // this content will be erased and replaced with new result everytime
//!macro-end

export { MySpecialExport } from './dir/file.tsx';
```

Like you see we can avoid writting all the time the same code just by using meta-programming tools. Above code is obviously not real code, but only example.
