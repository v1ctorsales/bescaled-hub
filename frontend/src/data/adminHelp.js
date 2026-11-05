// Keep instructions aligned with the named screens and controls. This is the
// single source for the Platform Guide; technical setup belongs in the READMEs.
import screenshots from './adminHelpScreenshots.json';

export const ADMIN_HELP_TOPICS = [
  {
    "id": "company-walkthrough",
    "title": "Platform overview",
    "summary": "BeScaled Hub records company assessments and makes their results available to administrators.",
    "paragraphs": [
      "BeScaled Hub contains two separate assessments. KTH - Innovation Readiness Level records readiness across six business and innovation areas. AI Maturity Test records Responsible AI practices across nine dimensions. Each assessment has its own answers, progress calculation, and submission process.",
      "Company accounts open a dashboard containing the two assessments. Administrators open the company directory and can view results across companies. Assessment answers are entered and updated through the company screens; the admin assessment screens are read-only.",
      "Each dashboard card opens its assessment. Its button reads Start assessment, Continue assessment, or Edit assessment according to the calculated progress. A progress percentage measures answered items rather than readiness levels, AI maturity ratings, or administrator approval.",
    ]
  },
  {
    id: "getting-started",
    title: "Getting started",
    summary: "The admin and company areas provide different views of the platform.",
    paragraphs: [
      "The company directory is the starting point for administrators. The company dashboard is the starting point for participants and contains the two assessment cards.",
      "View details opens a company’s assessment results. The settings button opens its access settings, and Slack discussions opens the connected conversation browser.",
      "Platform Guide is available in the header throughout the admin area. The Admin guide covers company management and result review; the Company guide describes the participant dashboard and assessments.",
      "Light mode and Dark mode change the appearance of the platform. The theme control is available on the login page and in the header. The initial theme follows the device setting; a selected preference is saved in the browser and applies across admin and company screens. Exported reports retain their report formatting.",
      "Companies sign in to their own dashboard and can access only their own assessments. Administrators can review every company. The admin assessment screens are read-only.",
    ],
  },
  {
    id: "login",
    title: "Login",
    summary: "Google sign-in determines which dashboard and data an account can access.",
    paragraphs: [
      "The login page contains the Terms of Use agreement and Google sign-in. Sign-in becomes available after the agreement box is checked.",
      "A registered administrator account opens the company directory after sign-in. Company accounts open their own dashboard. Company access depends on the exact Google account email saved in Login emails; administrator access is configured separately.",
      "Log out ends the current session. An expired session requires another sign-in with a registered account. Saved assessment data remains associated with the company.",
    ],
  },
  {
    group: "Admin guide",
    id: "dashboard",
    title: "Company directory",
    summary: "The directory lists companies, batch schedules, and assessment statuses.",
    paragraphs: [
      "The summary cards count three things separately: companies marked as enrolled, companies with saved KTH readiness data, and companies that have submitted an AI Maturity Test.",
      "The directory lists each company’s batch, batch start and end dates, and assessment status. A dash means a batch date has not been set.",
      "Completed means the company has completed the assessment. Pending means the company has not completed it yet.",
    ],
  },
  {
    group: "Admin guide",
    id: "add-company",
    title: "Company creation",
    summary: "Company records define contact details, account access, and batch membership.",
    paragraphs: [
      "The + Add company button in the directory opens the company creation form.",
      "The form contains Company name, Primary contact email, Description, up to three Login emails, and Batch. The default batch is 1; available batches range from 1 to 9.",
      "Login emails identify the Google accounts permitted to access the company. If the list is empty at creation, the primary contact email becomes its login email.",
      "Add company creates the record and closes the dialog after a successful response. Validation errors remain visible in the form. Cancel closes it without creating a company.",
      "Adding a company does not send an invitation email. Registered participants access the portal through its address using a Google account listed in Login emails.",
      "An email cannot be assigned to another company or already be an administrator email. Login emails are saved in lowercase. Use a description of up to 2,000 characters.",
    ],
  },
  {
    group: "Admin guide",
    id: "company-settings",
    title: "Company access and settings",
    summary: "Settings control login emails, the internal description, and batch assignment.",
    paragraphs: [
      "The settings button beside a company, or on its details page, opens the company settings dialog.",
      "Login emails supports up to three Google accounts. + Add email creates another email field and Remove removes an entry.",
      "Description and Batch are editable. Save stores the changes; Cancel closes the dialog without saving edits.",
      "Company name and Primary contact email are displayed but cannot be edited in this dialog. Ask the technical maintainer if either needs changing.",
      "The primary contact and login emails have different purposes: contact information alone does not grant access after creation. Saving an empty login-email list here leaves the company without an account that can sign in.",
      "Removing a login email prevents a future sign-in through that email, but it does not immediately end an existing session. Existing sessions may remain valid until their eight-hour expiry.",
    ],
  },
  {
    group: "Admin guide",
    id: "batches",
    title: "Batch dates",
    summary: "Batches group companies into program cohorts numbered 1–9.",
    paragraphs: [
      "Edit batches in the company directory opens the schedule for batches 1–9.",
      "Start date and End date use MM/YYYY, such as 02/2027. The end month must be the same as or later than the start month.",
      "Both dates can be empty for an unscheduled batch. Clearing a date removes that saved value.",
      "Save stores the schedule. Companies assigned to a batch display its saved dates in the directory.",
      "A batch is a group of companies participating in the program. Change a company’s batch in its settings. Batch dates do not change the assessment reporting periods, automatically close forms, or schedule reminders.",
    ],
  },
  {
    group: "Admin guide",
    id: "delete-company",
    title: "Company deletion",
    summary: "Deletion permanently removes a company and its assessment data.",
    paragraphs: [
      "Company settings contains Delete company. Selecting it displays a confirmation naming the company and describing the permanent removal.",
      "Yes, delete this company confirms deletion. Cancel at the confirmation step returns to settings.",
      "Company details provide report exports before deletion. An export preserves a reference copy of results, rather than a restorable backup.",
      "Deletion removes the company, its login-email assignments, readiness scores, checklist answers, and AI maturity answers. There is no undo or restore button. An exported report is a reference copy, not a backup that can be imported to restore the company.",
    ],
  },
  {
    group: "Admin guide",
    id: "readiness",
    title: "Admin KTH results",
    summary: "The admin KTH view displays saved scores, a radar chart, and level-guide answers.",
    paragraphs: [
      "View details opens company results. The KTH - Innovation Readiness Level tab contains the readiness assessment.",
      "The score table and radar chart display three reporting periods after readiness data has been saved.",
      "KTH level guide contains area tabs and every level’s requirements. Answer labels are Achieved, Not achieved, Not applicable, and Not marked for unanswered requirements.",
      "The six areas are Customer (CRL), Technology (TRL), Business (BRL), Intellectual Property (IPRL), Team (TmRL), and Funding (FRL). The readiness scale runs from 1 to 9. Stored zero values normally mean no score has been entered; charts and guide markers display these at the scale minimum of 1. Check the underlying table or XLSX before interpreting a level-1 marker as an assessment.",
      "The reporting periods are currently 10/2026, 02/2027, and 09/2027. Companies edit scores and guide answers as a draft, then save them together. Unsaved changes are not available to admins.",
      "When every requirement of a guide level is Achieved, the company’s first-period score can automatically rise to that level. This does not automatically lower the score if an answer is later changed, and the company can still edit the table score.",
      "The company’s progress percentage counts answered guide requirements and table scores for reporting months that have started. Any of the three answer statuses counts as answered; it does not necessarily mean achieved. Future periods are excluded. A fully answered area’s first-period zero can count as answered if no level was fully achieved.",
    ],
  },
  {
    group: "Admin guide",
    id: "maturity",
    title: "Admin AI maturity results",
    summary: "The admin AI maturity view displays submitted ratings, comments, and clarification flags.",
    paragraphs: [
      "AI Maturity Test is a tab within a company’s View details screen.",
      "After submission, the table displays each dimension’s five stages, rating, comment, and clarification flag. Unclear means the participant selected the option indicating that the item was not understood.",
      "Assessment answers are read-only in the admin view. Changes are made through the company account.",
      "There are nine dimensions and five stages per dimension, for 45 items. Ratings range from 0 to 4; zero is a valid rating and should not automatically be interpreted as an unanswered question.",
      "Dimensions cover human oversight, transparency, fairness, privacy, technical safety, accountability, traceability, innovation, and knowledge sharing. Stages run from Conceptual through Monitoring & Sharing.",
      "Answers save individually as the company enters them. Submission sets a separate flag and does not lock the test. The admin details screen shows the answer table after submission.",
    ],
  },
  {
    group: "Admin guide",
    "id": "company-follow-up",
    "title": "Saved results and assessment status",
    "summary": "Saved answers, submission status, and progress percentages describe different aspects of an assessment.",
    "paragraphs": [
      "The admin directory and View details display saved company data. KTH results reflect the latest successful Submit answers action. AI maturity answers save individually, while submission controls the directory badge and availability of the admin answer table.",
      "The KTH Completed badge means readiness data has been saved at least once. The AI Maturity Completed badge means the test has been submitted. Neither badge certifies that every requirement, rating, or reporting period is complete. The company dashboard calculates its progress percentages separately.",
      "The admin KTH tab displays the score table, radar chart, and requirement answers, including Not marked for unanswered requirements. The AI Maturity tab displays stage ratings, comments, and Unclear flags after submission. Changes to assessment answers are made through the company’s account.",
      "An open admin page retains the data it loaded. Refreshing loads later changes saved by company accounts. A difference between the company and admin views can result from unsaved KTH edits, saved AI maturity drafts awaiting submission, different progress rules, or a page that has not been refreshed.",
      "Company XLSX reports contain detailed assessment data, including saved AI maturity drafts. Company PDFs include readiness results when saved and AI maturity answers when submitted. Companies also have export controls on their own assessment screens. Reports reflect the data currently loaded in the exporting browser.",
      "Exported files are reference copies. The platform has no report import or restore feature, and admin review does not change a company’s answers or issue an approval or certification."
    ]
  },
  {
    group: "Admin guide",
    id: "exports",
    title: "Report exports",
    summary: "PDF and XLSX reports contain different views of directory and assessment data.",
    paragraphs: [
      "Export XLSX and Export PDF on the main admin page generate directory reports.",
      "The same controls within View details generate detailed reports for one company.",
      "Reports download through the browser and reflect the data loaded in the page. Refreshing the page before an export loads changes saved since the page was opened.",
      "Directory XLSX contains company ID, name, contact email, subscribed status, and the two assessment flags. It does not contain the complete assessment answers or batch dates. Directory PDF gives a company-by-company overview with statuses and readiness charts where readiness has been saved.",
      "A company XLSX includes Info (including the description), KTH scores, the full KTH Level Guide, and AI Maturity answers with comments, flags, and summary calculations. It includes saved maturity answers even before submission.",
      "A company PDF includes readiness scores and a chart when readiness is saved, the full level-guide checklist, and AI maturity answers when the test is submitted. It is not identical to the XLSX: for example, the internal description is included in the spreadsheet’s Info sheet.",
      "Exports reflect the data currently loaded in your browser. There is no report import feature. Share files only with the intended recipients because reports include company and contact information.",
    ],
  },
  {
    group: "Admin guide",
    id: "slack",
    title: "Slack discussions and exports",
    summary: "The Slack integration provides read-only conversations, replies, attachment previews, and archives.",
    paragraphs: [
      "Slack discussions opens from the company directory. Messages load after a Conversation is selected.",
      "Load older messages retrieves earlier history. Message replies expand into a thread. Supported PDF, PowerPoint, Word, image, and MP4 attachments have previews; files can also be downloaded.",
      "Export selected conversation creates an archive for one conversation. Export all conversations includes conversations marked ready to export.",
      "The progress indicator tracks history and reply loading, attachment downloads, transcript creation, and ZIP preparation. The page must remain open during export. The archive contains PDF transcripts and original shared files, with folders for an all-conversations export.",
      "Slack is optional and read-only here: you cannot send messages or replies. The list reflects the access and permissions of one Slack account connected by the technical maintainer, rather than your personal Slack sign-in. All portal admins use that same connection.",
      "The connected Slack account must be a member of a conversation before it can be exported. Export all skips conversations without membership. Exports fetch available history and replies beyond the messages currently loaded on screen; Slack permissions and retained history still apply.",
      "Large exports can take time. An unavailable attachment or failed request can stop an export; the error identifies the conversation. Try a single conversation first. Ask the technical maintainer about configuration or permission errors.",
    ],
  },
  {
    group: "Admin guide",
    id: "troubleshooting",
    title: "Troubleshooting",
    summary: "Common problems relate to account access, validation, saved data, sessions, or Slack permissions.",
    paragraphs: [
      "Google sign-in is unavailable: tick the Terms of Use agreement first. If sign-in still fails, check that you selected the intended Google account.",
      "Account not authorized or wrong dashboard: check the exact Google account email. Company access comes from Login emails; admin access is managed by the technical maintainer. A primary contact email is not always a login email.",
      "An email is already used by another account: remove it from the other company if appropriate, or use a different Google account. Administrator emails cannot also be assigned to companies.",
      "Settings will not save: provide a description, check email formats and duplicates, use at most three login emails, and read the error below the form. For batch dates, use MM/YYYY with an end month no earlier than the start month.",
      "A result looks missing or outdated: admin results depend on saved readiness data and the maturity test’s submission status. Refreshing the admin page loads the latest saved data. A Pending maturity badge can coexist with saved draft answers. Completed does not certify that every item is answered.",
      "Session expired: sign in again. Too many requests or a Slack rate-limit message: wait before retrying and avoid repeatedly starting exports. If a download does not appear, check the browser’s downloads and any displayed export error.",
      "Slack is not configured, a conversation is missing, or permissions are insufficient: ask the technical maintainer to check the connected account’s access and permissions.",
      "For an unresolved problem, give the maintainer the page address, company or conversation name, action you attempted, exact error text, and approximate time.",
    ],
  },
  {
    group: "Company guide",
    "id": "company-sign-in",
    "title": "Company access and dashboard",
    "summary": "Registered Google accounts provide access to a shared company dashboard.",
    "paragraphs": [
      "The login page requires agreement to the Terms of Use before Google sign-in is available. Company access is determined by the signed-in Google account’s exact email address and the Login emails saved in company settings.",
      "Up to three Google accounts can access one company. These accounts share the same company assessments and results; they do not receive separate questionnaires. The primary contact email is contact information and may differ from the accounts permitted to sign in.",
      "Creating a company or adding a login email does not send an invitation. Access becomes available through the portal address once the account has been registered and the settings saved.",
      "The company dashboard contains KTH - Innovation Readiness Level and AI Maturity Test. Not started means no counted progress, In progress means some items are counted, and Completed means the progress calculation has reached 100%.",
      "Back to dashboard returns from an assessment to the two cards. Log out ends the current session. Returning to the portal with the same registered account provides access to the company’s saved data. An expired session requires another sign-in.",
    ]
  },
  {
    group: "Company guide",
    "id": "company-readiness",
    "title": "Company KTH readiness assessment",
    "summary": "The KTH assessment combines a level guide, numerical scores, and a radar chart.",
    "paragraphs": [
      "The six areas are Customer (CRL), Technology (TRL), Business (BRL), Intellectual Property (IPRL), Team (TmRL), and Funding (FRL). They cover customer needs, technical development and validation, the business model, intellectual property, team capabilities, and financing. Each area has requirements at levels 1–9.",
      "Area tabs select the readiness area. The numbered level selector displays a level’s requirements. Each requirement accepts Achieved, Not achieved, or Not applicable. Not applicable records that a requirement does not fit the company’s situation. Selecting the same answer again clears it.",
      "After every requirement on a displayed level has an answer, the guide advances to the next level; after level 9, it advances to the next area. Area tabs and level numbers also allow manual navigation. Browsing a level does not change the recorded score.",
      "When every requirement of a level is Achieved, the first reporting period’s score for that area can increase to that level automatically. Not achieved and Not applicable count as answers but do not trigger that increase. Later changes to requirement answers do not automatically lower a score. The numerical table remains editable.",
      "For example, when every Customer level-3 requirement is Achieved and the first-period CRL score is 2, the score increases to 3. Opening level 5 displays its requirements without changing that score.",
      "KTH - Current Innovation Readiness Level contains the editable score table and radar chart for 10/2026, 02/2027, and 09/2027. Numerical scores range from 1 to 9. Future periods are labeled not yet due and remain editable, but their table scores do not count toward progress until that month begins.",
      "The progress calculation includes requirement answers across all levels and areas, plus table scores for reporting periods that have started. All three requirement answer statuses count as answered. A fully answered area’s first-period score also counts as complete even if no level was fully achieved. The percentage can change when another reporting period becomes due.",
      "The radar chart compares the recorded levels across areas and reporting periods. An empty table cell has no entered score even when a chart marker appears at the scale minimum of 1. The chart is not a percentage or a combined pass mark.",
      "KTH edits remain a draft until Submit answers stores the table scores and guide answers together. Unsaved changes are not available in the admin results or the company dashboard’s saved progress. A successful submission displays a confirmation; a failed request displays an error. About the level guide, opened with the help icon, describes these rules within the assessment."
    ]
  },
  {
    group: "Company guide",
    "id": "company-maturity",
    "title": "Company AI maturity assessment",
    "summary": "AI maturity records a separate rating, comment, and clarification flag for each stage.",
    "paragraphs": [
      "AI Maturity Test covers nine dimensions: Human Agency & Oversight, Transparency & Explainability, Fairness & Inclusion, Privacy & Data Governance, Technical Robustness & Safety, Accountability, Traceability, Innovation & Scalability, and Knowledge Sharing.",
      "Each dimension contains five stages: Conceptual, Implementation, Evaluation & Reflection, Ready to Monitor Practices, and Monitoring & Sharing. This produces 45 stage items. Dimension headings expand or collapse their stages, and each stage displays its assessment criteria.",
      "A new assessment displays an introduction and Start test. The form is shown after Start test is selected or when the current session has counted progress. Submitted assessments reopen in the form for review and editing.",
      "Each stage has an independent score from 0 to 4. Scores may differ across the five stages of the same dimension. The interface provides criteria for each stage but does not define named meanings for each number. Zero is a valid rating; a default zero alone does not show that a stage was reviewed.",
      "Add a comment opens a text field for context, examples, or questions. I don’t understand this toggles a clarification flag and disables score selection for that stage while active. The corresponding admin results show Unclear. The flag records uncertainty about the item, rather than proving that a practice is absent.",
      "The ratings completed counter and dimension counters track interaction with stage items. Rating changes, comments, and clarification flags can all contribute to this count. The initial Submit answers button becomes available after all 45 items have been interacted with. Submitted assessments are treated as reviewed when reloaded, so the counter is not a quality check of every answer.",
      "The company can export its current AI maturity answers with Export XLSX or Export PDF. The admin answer table appears after submission. The admin company XLSX export also includes saved draft answers before submission."
    ]
  },
].map((topic) => ({ ...topic, screenshots: screenshots[topic.id] }));
