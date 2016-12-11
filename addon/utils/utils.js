import require from 'require';

export function requireModule(module) {
  return require.has(module) ? require(module)['default'] : undefined;
}

export function pathInGlobs(path = '', globs = []) {
  for (let i = 0; i < globs.length; i++) {
    let regex = (`.${globs[i]}`).replace(new RegExp(/\.\*/, 'g'), '\\.(\\w+)').replace(new RegExp(/\.@each/, 'g'), '\\.(\\d+)');

    if ((`.${path}`).match(regex)) {
      return true;
    }
  }

  return false;
}
