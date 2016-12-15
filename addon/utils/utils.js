export function pathInGlobs(path = '', globs = []) {
  for (let i = 0; i < globs.length; i++) {
    if ((`.${path}`).match(regexFromGlob(globs[i]))) {
      return true;
    }
  }

  return false;
}

function regexFromGlob(glob) {
  return (`.${glob}`)
          .replace(new RegExp(/\.\*/, 'g'), '\\.(\\w+)')
          .replace(new RegExp(/\.@each/, 'g'), '\\.(\\d+)');
}
