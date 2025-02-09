import React, { useEffect } from 'react';
import recordEvent from 'platform/monitoring/record-event';
import { focusElement } from 'platform/utilities/ui';
import Wizard, {
  WIZARD_STATUS_COMPLETE,
} from 'applications/static-pages/wizard';

import { WIZARD_STATUS, PCPG_ROOT_URL } from '../constants';
import pages from '../wizard/pages';

const WizardContainer = props => {
  const { setWizardStatus } = props;
  useEffect(() => {
    focusElement('.va-nav-breadcrumbs-list');
  }, []);

  const handleClick = () => {
    recordEvent({
      event: `howToWizard-skip`,
    });
    sessionStorage.setItem(WIZARD_STATUS, WIZARD_STATUS_COMPLETE);
  };
  return (
    <div className="row vads-u-margin-bottom--1">
      <div className="usa-width-two-thirds medium-8 columns">
        <h1 className="vads-u-margin-top--1">
          Apply for Personalized Career Planning and Guidance with VA Form
          25-8832
        </h1>
        <p>
          Equal to VA Form 28-8832 (Education/Vocational Counseling Application)
        </p>
        <h2 className="vads-u-margin-top--3">Is this the form I need?</h2>
        <p>
          If you’re a Veteran, service member, or dependent, use this form to
          apply for personalized career counseling and support to help you find
          a training program or job. Answer a few questions to get started.
        </p>
        <p>
          <strong>If you already know this is the correct form, </strong>
          you can go directly to the online application without answering
          questions.{' '}
          <a
            href={`${PCPG_ROOT_URL}/introduction`}
            onClick={() => {
              handleClick();
            }}
          >
            Apply online with VA Form 25-8832
          </a>
        </p>
        <Wizard
          pages={pages}
          expander={false}
          setWizardStatus={setWizardStatus}
        />
      </div>
    </div>
  );
};

export default WizardContainer;
