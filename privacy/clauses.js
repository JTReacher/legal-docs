/**
 * Standard privacy policy clauses, taken from the iubenda policy in ../privacy-policy.html
 * (sources/privacy-policy-26629219_offical_download.pdf). Wording is kept as close to the
 * original as possible; changes are limited to "this Application" naming, dropping clauses
 * for services an app does not use, and pointing at the date at the top of the page.
 * Every string here is trusted HTML: config values never go in this file.
 */

const METHODS_OF_PROCESSING =
  'The Owner takes appropriate security measures to prevent unauthorised access, disclosure, ' +
  'modification, or unauthorised destruction of the Data. The Data processing is carried out using ' +
  'computers and/or IT enabled tools, following organisational procedures and modes strictly related ' +
  'to the purposes indicated.';

const THIRD_PARTY_DATA =
  'Users are responsible for any third-party Personal Data obtained, published or shared through ' +
  'this Application.';

const MANDATORY_DATA =
  'Unless specified otherwise, all Data requested by this Application is mandatory and failure to ' +
  'provide this Data may make it impossible for this Application to provide its services. In cases ' +
  'where this Application specifically states that some Data is not mandatory, Users are free not to ' +
  'communicate this Data without consequences to the availability or the functioning of the Service.';

const OPTIONAL_DATA =
  'Users are not obliged to provide any Data. Where this Application needs some Data for a feature, ' +
  'failing to provide it may make that feature impossible to use.';

const NO_AUTOMATED_DECISIONS =
  'This Application carries out no automated decision-making, including profiling, that produces ' +
  'legal or similarly significant effects for Users.';

const HANDLING_PAYMENTS =
  'This Application processes payments via external payment service providers (Google Play or the ' +
  'Apple App Store). Users provide their payment details directly to such payment service providers. ' +
  "This Application isn't involved in the collection and processing of such information: instead, it " +
  'will only receive a notification by the relevant payment service provider as to whether payment ' +
  'has been successfully completed.';

const ADVERTISING =
  'This type of service allows User Data to be utilised for advertising communication purposes. These ' +
  'communications are displayed in the form of banners and other advertisements on this Application, ' +
  'possibly based on User interests. The ad service may use Trackers and the unique device identifier ' +
  'for advertising (the Google advertising ID, or IDFA on iOS). Personalised ads and the Trackers ' +
  "behind them are used only with the User's consent, asked for when this Application first opens.";

const ADVERTISING_ID_RESET =
  'Users can also reset or delete their advertising ID, or opt out of personalised ads, in their ' +
  "device's settings (on Android, under Ads in the privacy or Google settings; on iOS, under Privacy, Tracking).";

const LEGAL_BASES = [
  'Users have given their consent for one or more specific purposes;',
  'provision of Data is necessary for the performance of an agreement with the User and/or for any pre-contractual obligations thereof;',
  'processing is necessary for compliance with a legal obligation to which the Owner is subject;',
  'processing is necessary for the purposes of the legitimate interests pursued by the Owner or by a third party.',
];

const LEGAL_BASIS_INTRO = 'The Owner may process Personal Data relating to Users if one of the following applies:';

const LEGAL_BASIS_OUTRO =
  'In any case, the Owner will gladly help to clarify the specific legal basis that applies to the processing.';

const RETENTION =
  'Personal Data shall be processed and stored for as long as required by the purpose they have been ' +
  'collected for. Once the retention period expires, Personal Data shall be deleted.';

const DEVICE_PERMISSIONS =
  "This Application requests certain permissions from Users that allow it to access the User's " +
  'device Data as described below.';

const SYSTEM_LOGS =
  'Third-party services contacted by this Application may collect files that record the interaction ' +
  '(System logs) or use other Personal Data (such as the IP Address) for operation and maintenance.';

const RIGHTS_INTRO =
  'Users may exercise certain rights regarding their Data processed by the Owner. In particular, ' +
  'Users have the right to do the following, to the extent permitted by law:';

const RIGHTS = [
  '<strong>Withdraw their consent at any time.</strong> Users have the right to withdraw consent where they have previously given their consent to the processing of their Personal Data.',
  '<strong>Object to processing of their Data (objection).</strong> Users have the right to object to the processing of their Data if the processing is carried out on a legal basis other than consent.',
  '<strong>Access their Data.</strong> Users have the right to learn if Data is being processed by the Owner, obtain disclosure regarding certain aspects of the processing and obtain a copy of the Data undergoing processing.',
  '<strong>Verify and seek rectification.</strong> Users have the right to verify the accuracy of their Data and ask for it to be updated or corrected.',
  '<strong>Restrict the processing of their Data.</strong> Users have the right to restrict the processing of their Data. In this case, the Owner will not process their Data for any purpose other than storing it.',
  '<strong>Have their Personal Data deleted or otherwise removed (erasure).</strong> Users have the right to obtain the erasure of their Data from the Owner.',
  '<strong>Receive their Data and have it transferred to another controller (portability).</strong> Users have the right to receive their Data in a structured, commonly used and machine readable format and, if technically feasible, to have it transmitted to another controller without any hindrance.',
  '<strong>Lodge a complaint.</strong> Users have the right to bring a claim before their competent data protection authority.',
];

const EXERCISE_RIGHTS =
  'Any requests to exercise User rights can be directed to the Owner through the contact details ' +
  'provided in this document. Such requests are free of charge and will be answered by the Owner as ' +
  'early as possible and always within one month, providing Users with the information required by law.';

const CHANGES =
  'The Owner reserves the right to make changes to this privacy policy at any time by notifying its ' +
  'Users on this page and possibly within this Application. It is strongly recommended to check this ' +
  'page often, referring to the date of the last modification listed at the top. Should the changes ' +
  "affect processing activities performed on the basis of the User's consent, the Owner shall collect " +
  'new consent from the User, where required.';

const NOT_CONTAINED =
  'More details concerning the collection or processing of Personal Data may be requested from the ' +
  'Owner at any time. Please see the contact information at the beginning of this document.';

module.exports = {
  METHODS_OF_PROCESSING,
  THIRD_PARTY_DATA,
  MANDATORY_DATA,
  OPTIONAL_DATA,
  HANDLING_PAYMENTS,
  ADVERTISING,
  ADVERTISING_ID_RESET,
  NO_AUTOMATED_DECISIONS,
  LEGAL_BASES,
  LEGAL_BASIS_INTRO,
  LEGAL_BASIS_OUTRO,
  RETENTION,
  DEVICE_PERMISSIONS,
  SYSTEM_LOGS,
  RIGHTS_INTRO,
  RIGHTS,
  EXERCISE_RIGHTS,
  CHANGES,
  NOT_CONTAINED,
};
