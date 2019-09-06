const expect = require('chai').expect;
const sempub = require('../../../lib/sempub');
const version = require('../../../lib/version');

describe('require', function () {
  it("test pkg conf publish", (done) => {
    const s = new sempub();
    expect(s.pkg.name).to.equal(require('./package.json').name);
    expect(s.opt.interact).to.be.false;
    expect(s.opt.subPackage.enable).to.be.false;
    expect(s.opt.minIncrease).to.deep.equal(version.getMinimumIncrease(s.pkg.version));

    expect(s.opt.publish).to.deep.equal(require('./package.json').sempub.publish);
    s.publish().then((e) => {
      done();
    });
  })
})

