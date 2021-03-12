---
title: Magicless
order: 10
---

<div class="illus"><%- include('/assets/illus/undraw-magic.svg') %></div>

# Magicless

One of the main purpose of the project is forbidden magic. Magic itself can be useful in some cases and we just try to create border of usefulness and reliability of just magic.

> *Magic* in programming can be term for many things. For us *Magic code* means non-transparent code - code that create unforeseen result, hard to understand side-effect etc.

Magic can do multiple things, and provie many features and side-effects. We need to consider types of such magic.

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

But are they always bad? What can be named as "side-effect" and what cannot be? It's pretty hard to tell when something will become a side-effect, beacuse in practice every piece of code can change DOM or other global scope things. We can't avoid side-effects in that meaning, but making code more related allows us control such things. Consider such alternative:

```tsx
const decorateAnchors = (anchors: HTMLElement[]) => {
    Array.from(document.querySelectorAll('a')).forEach(el => {
        el.innerText += '?';
        el.style.color = 'red';
    });
};

// somewhere else

const anchor = document.querySelector('a'); // get something
decorateAnchors([anchor]);
console.log(anchor); // our anchor is safe :)
```

Relating things allows us make code safer.

## 2. Non-obvious result of settings

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

All other programming things have to be programmable and possible typed, because it's only way to check source of thing and understand how they works and/or get syntax errors instead of weird effects of such configuration running.
