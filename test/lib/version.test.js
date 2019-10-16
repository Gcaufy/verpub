const expect = require('chai').expect;

const getMinimumIncrease = require('../../lib/version').getMinimumIncrease;

const cases = [
  {
    input: '1.2.3',
    expect: {
      increase: 'patch',
      tag: null,
      version: '1.2.4'
    }
  },
  {
    input: '1.2.3-0',
    expect: {
      increase: 'prerelease',
      tag: null,
      version: '1.2.3-1'
    }
  },
  {
    input: '1.2.3-0.3',
    expect: {
      increase: 'prerelease',
      tag: null,
      version: '1.2.3-0.4'
    }
  },
  {
    input: '1.2.3-alpha',
    expect: {
      increase: 'prerelease',
      tag: 'alpha',
      version: '1.2.3-alpha.0'
    }
  },
  {
    input: '1.2.3-alpha.20',
    expect: {
      increase: 'prerelease',
      tag: 'alpha',
      version: '1.2.3-alpha.21'
    }
  }
];

describe('version', function() {
  cases.forEach(c => {
    let calced = getMinimumIncrease(c.input);
    it(`${c.input} => ${calced.version}`, function() {
      expect(calced).to.be.deep.equal(c.expect);
    });
  });
});
