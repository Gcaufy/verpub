module.exports = {
  updateInfoMap(params) {
    const { infoMap = [], hash, version, id } = params;
    const obj = {};
    infoMap.forEach(item => {
      switch (item) {
        case 'version':
          obj.version = version;
          break;
        case '_id':
          obj._id = id;
          break;
        case '_commitid':
          obj._commitid = hash;
          break;
        default:
          break;
      }
    });
    return obj;
  }
};
