const expect = require('chai').expect;
const verpub = require('../../../lib/verpub');
const version = require('../../../lib/version');

describe('require', function () {
  it("test json conf publish", () => {
    const s = new verpub();
    expect(s.pkg.name).to.equal(require('./package.json').name);
    expect(s.opt.interact).to.be.false;
    expect(s.opt.subPackage.enable).to.be.true;
    expect(s.opt.minIncrease).to.deep.equal(version.getMinimumIncrease(s.pkg.version));
  });
})

