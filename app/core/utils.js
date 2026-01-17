export function uid(prefix='id'){
  return prefix + '_' + Math.random().toString(36).slice(2,9);
}

export function now(){
  return Date.now();
}
