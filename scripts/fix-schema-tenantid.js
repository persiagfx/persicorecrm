const fs = require('fs');
const path = require('path');
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const modelsToFix = [
  'Commission', 'LegalCase', 'LegalContract', 'SurveyForm', 'FormResponse',
  'TeamConversation', 'CallLog', 'CustomerSegment', 'OrgNode', 'EmployeeContract',
  'TrainingCourse', 'TrainingEnrollment', 'JobPosting', 'ChartOfAccount',
  'LedgerEntry', 'BankAccount', 'BankTransaction', 'FixedAsset', 'TaxRecord',
  'UTMLink', 'EmailCampaign', 'MarketingPersona', 'LandingPage', 'ABTest',
  'LegalDocument', 'CourtHearing', 'LegalDeadline',
];

let changed = 0;
for (const model of modelsToFix) {
  const hasTenant = new RegExp(`model ${model} \\{[^}]*tenantId`, 's').test(schema);
  if (hasTenant) { console.log(`SKIP: ${model}`); continue; }

  const insertRegex = new RegExp(`(model ${model} \\{\\n  id\\s+String\\s+@id[^\\n]*\\n)`, 's');
  if (insertRegex.test(schema)) {
    schema = schema.replace(insertRegex, `$1  tenantId     String?\n`);
    console.log(`FIXED: ${model}`);
    changed++;
  } else {
    console.log(`NOT FOUND: ${model}`);
  }
}

if (changed > 0) {
  fs.writeFileSync(schemaPath, schema);
  console.log(`\n${changed} models updated.`);
} else {
  console.log('No changes needed.');
}
