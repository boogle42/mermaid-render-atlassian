import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isBuiltIn, toMatchPattern } from '../src/options/hosts.js';

test('normalises host input to a match pattern', () => {
  assert.equal(toMatchPattern('jira.example.com'), 'https://jira.example.com/*');
  assert.equal(toMatchPattern(' https://Wiki.Example.com/display/X?y=1 '), 'https://wiki.example.com/*');
  assert.equal(toMatchPattern('http://localhost:8090'), 'http://localhost/*');
});

test('rejects unusable input', () => {
  assert.throws(() => toMatchPattern(''));
  assert.throws(() => toMatchPattern('ftp://files.example.com'));
  assert.throws(() => toMatchPattern('not a host'));
  assert.throws(() => toMatchPattern('intranet'));
});

test('detects hosts the built-in patterns already cover', () => {
  assert.equal(isBuiltIn('https://acme.atlassian.net/*'), true);
  assert.equal(isBuiltIn('https://truecontext.jira.com/*'), true);
  assert.equal(isBuiltIn('https://bitbucket.org/*'), true);
  assert.equal(isBuiltIn('https://jira.example.com/*'), false);
  assert.equal(isBuiltIn('http://acme.atlassian.net/*'), false);
});
