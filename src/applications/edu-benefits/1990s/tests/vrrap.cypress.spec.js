import path from 'path';

import testForm from 'platform/testing/e2e/cypress/support/form-tester';
import { createTestConfig } from 'platform/testing/e2e/cypress/support/form-tester/utilities';

import formConfig from '../config/form';
import manifest from '../manifest.json';

const testConfig = createTestConfig(
  {
    dataPrefix: 'data',

    // Rename and modify the test data as needed.
    dataSets: ['test-data'],

    fixtures: {
      data: path.join(__dirname, 'fixtures', 'data'),
    },

    pageHooks: {
      introduction: ({ afterHook }) => {
        afterHook(() => {
          cy.get('va-button[text*="start"]')
            .last()
            .click();
        });
      },
    },

    setupPerTest: () => {
      // Log in if the form requires an authenticated session.
      // cy.login();

      cy.route('POST', formConfig.submitUrl, { status: 200 });
    },

    // Skip tests in CI until the form is released.
    // Remove this setting when the form has a content page in production.
    // skip: Cypress.env('CI'),
    skip: true, // program has expired as of Dec 10 2022 for new applicants. Code remains incase program is extended
  },
  manifest,
  formConfig,
);

testForm(testConfig);
