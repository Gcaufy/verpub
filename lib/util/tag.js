module.exports = {
  loadTag(template, params) {
    let rst = template;
    Object.keys(params).forEach(k => {
      const reg = new RegExp('{' + k + '}', 'g');
      rst = rst.replace(reg, params[k]);
    });
    return rst;
  },
  getPackageTag(pkg, tag) {
    return this.loadTag(tag, {
      name: pkg.name,
      version: pkg.version,
      tag: pkg.tag
    });
  }
};
