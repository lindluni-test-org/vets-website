import mockSentMessages from '../fixtures/sentResponse/sent-messages-response.json';
import mockSentFolderMetaResponse from '../fixtures/sentResponse/folder-sent-metadata.json';
import mockThreadResponse from '../fixtures/sentResponse/sent-thread-response.json';
import mockSingleMessageResponse from '../fixtures/sentResponse/sent-single-message-response.json';
import sentSearchResponse from '../fixtures/sentResponse/sent-search-response.json';
import mockSortedMessages from '../fixtures/sentResponse/sorted-sent-messages-response.json';
import { Locators, Paths } from '../utils/constants';

class PatientMessageSentPage {
  loadMessages = (mockMessagesResponse = mockSentMessages) => {
    cy.intercept(
      'GET',
      `${Paths.INTERCEPT.MESSAGE_FOLDERS}/-1*`,
      mockSentFolderMetaResponse,
    ).as('sentFolder');
    cy.intercept(
      'GET',
      `${Paths.INTERCEPT.MESSAGE_FOLDERS}/-1/threads**`,
      mockMessagesResponse,
    ).as('sentFolderMessages');
    cy.get(Locators.FOLDERS.SENT).click();
    cy.wait('@sentFolder');
    cy.wait('@sentFolderMessages');
  };

  loadDetailedMessage = (detailedMessage = mockSingleMessageResponse) => {
    cy.intercept(
      'GET',
      `${Paths.INTERCEPT.MESSAGES}/${
        detailedMessage.data.attributes.messageId
      }/thread`,
      mockThreadResponse,
    ).as('threadResponse');

    cy.intercept(
      'GET',
      `${Paths.INTERCEPT.MESSAGES}/${
        detailedMessage.data.attributes.messageId
      }`,
      mockSingleMessageResponse,
    ).as('detailedMessage');

    cy.get(Locators.THREADS)
      .first()
      .click();
  };

  inputFilterDataText = text => {
    cy.get(Locators.FILTER_INPUT)
      .shadow()
      .find('#inputField')
      .type(`${text}`, { force: true });
  };

  clickFilterMessagesButton = () => {
    cy.intercept(
      'POST',
      `${Paths.INTERCEPT.MESSAGE_FOLDERS}/-1/search`,
      sentSearchResponse,
    );
    cy.get(Locators.BUTTONS.FILTER).click({ force: true });
  };

  clickClearFilterButton = () => {
    this.inputFilterDataText('any');
    this.clickFilterMessagesButton();
    cy.get(Locators.CLEAR_FILTERS).click({ force: true });
  };

  clickSortMessagesByDateButton = (
    text,
    sortedResponse = mockSortedMessages,
  ) => {
    cy.get(Locators.DROPDOWN)
      .shadow()
      .find('select')
      .select(`${text}`, { force: true });
    cy.intercept(
      'GET',
      `${Paths.INTERCEPT.MESSAGE_FOLDERS}/-1/threads**`,
      sortedResponse,
    );
    cy.get(Locators.BUTTONS.SORT).click({ force: true });
  };

  verifySorting = () => {
    let listBefore;
    let listAfter;
    cy.get(Locators.THREAD_LIST)
      .find(Locators.DATE_RECEIVED)
      .then(list => {
        listBefore = Cypress._.map(list, el => el.innerText);
        cy.log(JSON.stringify(listBefore));
      })
      .then(() => {
        this.clickSortMessagesByDateButton('Oldest to newest');
        cy.get(Locators.THREAD_LIST)
          .find(Locators.DATE_RECEIVED)
          .then(list2 => {
            listAfter = Cypress._.map(list2, el => el.innerText);
            cy.log(JSON.stringify(listAfter));
            expect(listBefore[0]).to.eq(listAfter[listAfter.length - 1]);
            expect(listBefore[listBefore.length - 1]).to.eq(listAfter[0]);
          });
      });
  };

  verifyFolderHeaderText = text => {
    cy.get(Locators.FOLDERS.FOLDER_HEADER).should('have.text', `${text}`);
  };

  verifyResponseBodyLength = (responseData = mockSentMessages) => {
    cy.get(Locators.THREADS).should(
      'have.length',
      `${responseData.data.length}`,
    );
  };

  verifyFilterResultsText = (
    filterValue,
    responseData = sentSearchResponse,
  ) => {
    cy.get(Locators.MESSAGES).should(
      'have.length',
      `${responseData.data.length}`,
    );

    cy.get(Locators.ALERTS.HIGHLIGHTED).each(element => {
      cy.wrap(element)
        .invoke('text')
        .then(text => {
          const lowerCaseText = text.toLowerCase();
          expect(lowerCaseText).to.contain(`${filterValue}`);
        });
    });
  };

  verifyFilterFieldCleared = () => {
    cy.get(Locators.FILTER_INPUT)
      .shadow()
      .find('#inputField')
      .should('be.empty');
  };
}

export default new PatientMessageSentPage();
