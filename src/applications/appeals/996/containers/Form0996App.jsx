import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { getStoredSubTask } from '@department-of-veterans-affairs/platform-forms/sub-task';

import { selectProfile, isLoggedIn } from 'platform/user/selectors';
import RoutedSavableApp from '~/platform/forms/save-in-progress/RoutedSavableApp';
import { setData } from '~/platform/forms-system/src/js/actions';

import formConfig from '../config/form';
import {
  DATA_DOG_ID,
  DATA_DOG_TOKEN,
  DATA_DOG_SERVICE,
  SUPPORTED_BENEFIT_TYPES_LIST,
} from '../constants';
import forcedMigrations from '../migrations/forceMigrations';

import { getContestableIssues as getContestableIssuesAction } from '../actions';

import { FETCH_CONTESTABLE_ISSUES_INIT } from '../../shared/actions';
import { wrapInH1 } from '../../shared/content/intro';
import { copyAreaOfDisagreementOptions } from '../../shared/utils/areaOfDisagreement';
import { useBrowserMonitoring } from '../../shared/utils/useBrowserMonitoring';
import {
  getIssueNameAndDate,
  getSelected,
  issuesNeedUpdating,
  processContestableIssues,
} from '../../shared/utils/issues';

import { data996 } from '../../shared/props';

export const Form0996App = ({
  loggedIn,
  location,
  children,
  formData,
  setFormData,
  router,
  getContestableIssues,
  contestableIssues,
  legacyCount,
}) => {
  // Make sure we're only loading issues once - see
  // https://github.com/department-of-veterans-affairs/va.gov-team/issues/33931
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);

  const subTaskBenefitType =
    formData?.benefitType || getStoredSubTask()?.benefitType;

  const hasSupportedBenefitType = SUPPORTED_BENEFIT_TYPES_LIST.includes(
    subTaskBenefitType,
  );

  useEffect(
    () => {
      if (hasSupportedBenefitType) {
        // form data is reset after logging in and from the save-in-progress data,
        // so get it from the session storage
        if (!formData.benefitType) {
          setFormData({
            ...formData,
            benefitType: subTaskBenefitType,
          });
        } else if (loggedIn && formData.benefitType) {
          const areaOfDisagreement = getSelected(formData);
          if (!isLoadingIssues && (contestableIssues?.status || '') === '') {
            // load benefit type contestable issues
            setIsLoadingIssues(true);
            getContestableIssues({ benefitType: formData.benefitType });
          } else if (
            issuesNeedUpdating(
              contestableIssues?.issues,
              formData?.contestedIssues,
            ) ||
            contestableIssues.legacyCount !== formData.legacyCount
          ) {
            /**
             * Force HLR v2 update
             * The migration itself should handle this, but it only calls the
             * function if the save-in-progress version number changes (migration
             * length in form config). Since Lighthouse is reporting seeing v1
             * submissions still, we need to prevent v1 data from being submitted
             */
            const data = formData?.informalConferenceRep?.name
              ? forcedMigrations(formData)
              : formData;

            /** Update dynamic data:
             * user changed address, phone, email
             * user changed benefit type
             * changes to contestable issues (from a backend update)
             */
            setFormData({
              ...data,
              contestedIssues: processContestableIssues(
                contestableIssues?.issues,
              ),
              legacyCount: contestableIssues?.legacyCount,
            });
          } else if (
            areaOfDisagreement?.length !==
              formData.areaOfDisagreement?.length ||
            !areaOfDisagreement.every(
              (entry, index) =>
                getIssueNameAndDate(entry) ===
                getIssueNameAndDate(formData.areaOfDisagreement[index]),
            )
          ) {
            // Area of Disagreement is created by combining the loaded contestable
            // issues with the Veteran-added additional issues
            setFormData({
              ...formData,
              // save existing settings
              areaOfDisagreement: copyAreaOfDisagreementOptions(
                areaOfDisagreement,
                formData.areaOfDisagreement,
              ),
            });
          }
        }
      }
    },
    [
      contestableIssues,
      formData,
      getContestableIssues,
      hasSupportedBenefitType,
      isLoadingIssues,
      legacyCount,
      loggedIn,
      setFormData,
      subTaskBenefitType,
    ],
  );

  let content = (
    <RoutedSavableApp formConfig={formConfig} currentLocation={location}>
      {children}
    </RoutedSavableApp>
  );

  // Go to start page if we don't have an expected benefit type
  if (!location.pathname.endsWith('/start') && !hasSupportedBenefitType) {
    router.push('/start');
    content = wrapInH1(
      <va-loading-indicator
        set-focus
        message="Please wait while we restart the application for you."
      />,
    );
  } else if (
    loggedIn &&
    hasSupportedBenefitType &&
    ((contestableIssues?.status || '') === '' ||
      contestableIssues?.status === FETCH_CONTESTABLE_ISSUES_INIT)
  ) {
    content = wrapInH1(
      <va-loading-indicator
        set-focus
        message="Loading your previous decisions..."
      />,
    );
  }

  // Add Datadog UX monitoring to the application
  useBrowserMonitoring({
    loggedIn,
    formId: 'hlr', // becomes "nodBrowserMonitoringEnabled" feature flag
    version: '1.0.0',
    applicationId: DATA_DOG_ID,
    clientToken: DATA_DOG_TOKEN,
    service: DATA_DOG_SERVICE,
  });

  // Add data-location attribute to allow styling specific pages
  return (
    <article id="form-0996" data-location={`${location?.pathname?.slice(1)}`}>
      {content}
    </article>
  );
};

Form0996App.propTypes = {
  getContestableIssues: PropTypes.func.isRequired,
  setFormData: PropTypes.func.isRequired,
  children: PropTypes.any,
  contestableIssues: PropTypes.shape({
    status: PropTypes.string,
    issues: PropTypes.array,
    legacyCount: PropTypes.number,
  }),
  formData: data996,
  legacyCount: PropTypes.number,
  location: PropTypes.shape({
    pathname: PropTypes.string,
  }),
  loggedIn: PropTypes.bool,
  profile: PropTypes.shape({
    vapContactInfo: PropTypes.shape({}),
  }),
  router: PropTypes.shape({
    push: PropTypes.func,
  }),
  savedForms: PropTypes.array,
};

const mapStateToProps = state => ({
  loggedIn: isLoggedIn(state),
  formData: state.form?.data || {},
  profile: selectProfile(state),
  savedForms: state.user?.profile?.savedForms || [],
  contestableIssues: state.contestableIssues || {},
  legacyCount: state.legacyCount || 0,
});

const mapDispatchToProps = {
  setFormData: setData,
  getContestableIssues: getContestableIssuesAction,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Form0996App);
