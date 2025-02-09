import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import scrollToTop from 'platform/utilities/ui/scrollToTop';
// eslint-disable-next-line import/no-unresolved
import { recordEvent } from '@department-of-veterans-affairs/platform-monitoring/exports';
import { createAnalyticsSlug } from '../../../utils/analytics';

import { makeSelectFeatureToggles } from '../../../utils/selectors/feature-toggles';
import BackToAppointments from '../../../components/BackToAppointments';
import TravelPayReimbursementLink from '../../../components/TravelPayReimbursementLink';
import Wrapper from '../../../components/layout/Wrapper';
import { useSendTravelPayClaim } from '../../../hooks/useSendTravelPayClaim';
import TravelPayAlert from './TravelPayAlert';
import { useStorage } from '../../../hooks/useStorage';
import { makeSelectForm } from '../../../selectors';
import { useFormRouting } from '../../../hooks/useFormRouting';
import AppointmentListItem from '../../../components/AppointmentDisplay/AppointmentListItem';
import { getAppointmentId } from '../../../utils/appointment';
import { useGetCheckInData } from '../../../hooks/useGetCheckInData';
import { useUpdateError } from '../../../hooks/useUpdateError';
import { APP_NAMES } from '../../../utils/appConstants';

const CheckInConfirmation = props => {
  const { appointments, selectedAppointment, triggerRefresh, router } = props;
  const selectFeatureToggles = useMemo(makeSelectFeatureToggles, []);
  const featureToggles = useSelector(selectFeatureToggles);
  const { isTravelReimbursementEnabled } = featureToggles;
  const selectForm = useMemo(makeSelectForm, []);
  const form = useSelector(selectForm);
  const {
    isLoading: isCheckInDataLoading,
    checkInDataError,
    refreshCheckInData,
    isComplete,
  } = useGetCheckInData({
    refreshNeeded: false,
    appointmentsOnly: true,
    app: APP_NAMES.CHECK_IN,
  });
  const { updateError } = useUpdateError();
  const { t } = useTranslation();
  const { jumpToPage } = useFormRouting(router);
  const appointment = selectedAppointment;

  const {
    travelPayEligible,
    travelPayClaimError,
    travelPayClaimRequested,
    travelPayClaimSent,
  } = useSendTravelPayClaim(appointment);

  useEffect(
    () => {
      scrollToTop('topScrollElement');
      triggerRefresh();
    },
    [triggerRefresh],
  );

  const {
    setShouldSendTravelPayClaim,
    getShouldSendTravelPayClaim,
  } = useStorage(APP_NAMES.CHECK_IN);

  const { setTravelPaySent, getTravelPaySent } = useStorage(
    APP_NAMES.CHECK_IN,
    true,
  );

  useEffect(
    () => {
      if (travelPayClaimSent) {
        const { stationNo } = selectedAppointment;
        const travelPaySent = getTravelPaySent(window);
        travelPaySent[stationNo] = new Date();
        setShouldSendTravelPayClaim(window, false);
        setTravelPaySent(window, travelPaySent);
      }
    },
    [
      travelPayClaimSent,
      setShouldSendTravelPayClaim,
      setTravelPaySent,
      getTravelPaySent,
      selectedAppointment,
    ],
  );

  const handleDetailClick = e => {
    e.preventDefault();
    recordEvent({
      event: createAnalyticsSlug('details-link-clicked', 'nav'),
    });

    refreshCheckInData();
  };

  useEffect(
    () => {
      if (isComplete) {
        jumpToPage(`appointment-details/${getAppointmentId(appointment)}`);
      }
    },
    [isComplete, jumpToPage, appointment],
  );
  useEffect(
    () => {
      if (checkInDataError) {
        updateError('refresh-on-details');
      }
    },
    [checkInDataError, updateError],
  );

  const renderLoadingMessage = () => {
    return (
      <div>
        <va-loading-indicator
          data-testid="loading-indicator"
          message={t('loading')}
        />
      </div>
    );
  };

  const staffMessage = () => {
    const arrivedAnswer = form.data['arrived-at-facility'];
    if (arrivedAnswer === 'no') {
      return t('the-staff-can-call-you-back-anytime-see-staff');
    }
    return t('the-staff-can-call-you-back-anytime');
  };

  const renderConfirmationMessage = () => {
    return (
      <Wrapper
        pageTitle={t('youre-checked-in')}
        testID="multiple-appointments-confirm"
      >
        <div data-testid="confirmation-message">
          <p>{staffMessage()}</p>
          <p data-testid="tell-staff-member">
            {t('tell-a-staff-member-if-you-wait')}
          </p>
        </div>
        <h2 className="vads-u-font-family--serif">{t('your-appointment')}</h2>
        <ul
          className="vads-u-border-top--1px vads-u-margin-bottom--4 check-in--appointment-list"
          data-testid="appointment-list"
        >
          <AppointmentListItem
            appointment={appointment}
            key={0}
            showDetailsLink
            goToDetails={handleDetailClick}
            router={router}
            page="confirmation"
            app={APP_NAMES.CHECK_IN}
          />
        </ul>
        {isTravelReimbursementEnabled ? (
          <>
            <h2 data-testid="travel-reimbursement-heading">
              {t('travel-reimbursement')}
            </h2>
            <TravelPayAlert
              travelPayClaimError={travelPayClaimError}
              travelPayClaimRequested={travelPayClaimRequested}
              travelPayEligible={travelPayEligible}
            />
          </>
        ) : (
          <TravelPayReimbursementLink />
        )}
        {appointments.length > 1 && <BackToAppointments />}
      </Wrapper>
    );
  };

  if (
    !isCheckInDataLoading &&
    (!isTravelReimbursementEnabled ||
      !travelPayEligible ||
      (travelPayClaimRequested === false || travelPayClaimSent) ||
      !getShouldSendTravelPayClaim(window))
  ) {
    return renderConfirmationMessage();
  }

  return renderLoadingMessage();
};

CheckInConfirmation.propTypes = {
  appointments: PropTypes.array,
  router: PropTypes.object,
  selectedAppointment: PropTypes.object,
  triggerRefresh: PropTypes.func,
};

export default CheckInConfirmation;
