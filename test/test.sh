#!/bin/bash

NODE_ENV=testing find ./test/lib | grep test.js | xargs mocha

cd test/config/js

cd .. && cd js && npm run test
cd .. && cd json && npm run test
cd .. && cd pkg && npm run test
