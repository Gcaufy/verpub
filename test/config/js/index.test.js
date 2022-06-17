const expect = require('chai').expect;
const verpub = require('../../../lib/verpub');
const version = require('../../../lib/version');

describe('require', function() {
  it('test js conf publish', () => {
    const s = new verpub({ dryRun: true });
    expect(s.pkg.name).to.equal(require('./package.json').name);
    expect(s.opt.interact).to.be.false;
    expect(s.opt.subPackage.enable).to.be.false;
    expect(s.opt.minIncrease).to.deep.equal(version.getMinimumIncrease(s.pkg.version));
  });

  it('test js api', () => {
    const s = new verpub({ dryRun: true });
    s.publish({
      desc: '测试'
    });
    expect(s.pkg.name).to.equal(require('./package.json').name);
    expect(s.opt.interact).to.be.false;
    expect(s.opt.subPackage.enable).to.be.false;
    expect(s.opt.minIncrease).to.deep.equal(version.getMinimumIncrease(s.pkg.version));
  });
});
