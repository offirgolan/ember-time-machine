export default function shouldIgnoreRecord(ignoredProperties, record) {
  for(let i = 0; i < ignoredProperties.length; i++) {
    // object.array.@each.array.@each.prop === object.array.1.array.2.prop
    if(ignoredProperties[i] === record.fullPath.replace(new RegExp(/\.\d+\./, 'g'), '.@each.')) {
      return true;
    }
  }

  return false;
}
