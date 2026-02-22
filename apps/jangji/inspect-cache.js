const { defaultCache } = require('@ducanh2912/next-pwa');
console.log(JSON.stringify(defaultCache, (k, v) => (v instanceof RegExp ? v.toString() : v), 2));
