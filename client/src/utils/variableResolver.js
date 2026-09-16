/**
 * Centralized Client-Side Variable Resolver & Personalization Utility
 * Guarantees identical variable replacement behavior across Preview, Editor, Manual Email & Test Email.
 */

export const SUPPORTED_VARIABLES = [
  { tag: '{{first_name}}', key: 'first_name', category: 'Lead', label: 'First Name', example: 'Josh' },
  { tag: '{{last_name}}', key: 'last_name', category: 'Lead', label: 'Last Name', example: 'Dasilva' },
  { tag: '{{full_name}}', key: 'full_name', category: 'Lead', label: 'Full Name', example: 'Josh Dasilva' },
  { tag: '{{email}}', key: 'email', category: 'Lead', label: 'Email Address', example: 'josh.dasilva@example.com' },
  { tag: '{{phone}}', key: 'phone', category: 'Lead', label: 'Phone Number', example: '+1 (705) 555-0192' },
  { tag: '{{company}}', key: 'company', category: 'Lead', label: 'Company', example: 'Acme Corp' },
  { tag: '{{lead_source}}', key: 'lead_source', category: 'Lead', label: 'Lead Source', example: 'Meta Ads' },
  { tag: '{{lead_stage}}', key: 'lead_stage', category: 'Lead', label: 'Lead Stage', example: 'Contacted' },
  { tag: '{{assigned_to}}', key: 'assigned_to', category: 'Assignment', label: 'Assigned To', example: 'Maninder Pal Singh' },
  { tag: '{{admin_name}}', key: 'admin_name', category: 'CRM', label: 'Admin Name', example: 'Maninder Pal Singh' },
];

export const VALID_VARIABLE_TAGS = new Set([
  'first_name', 'firstName',
  'last_name', 'lastName',
  'full_name', 'fullName', 'name',
  'email',
  'phone',
  'company',
  'lead_source', 'leadSource', 'source',
  'lead_stage', 'leadStage', 'stage',
  'assigned_to', 'assignedTo',
  'admin_name', 'adminName'
]);

// Sample lead used ONLY when no real lead is selected and sample mode is active
export const SAMPLE_LEAD_DATA = {
  _isSample: true,
  name: 'Sample Lead',
  fullName: 'Sample Lead',
  firstName: 'Sample',
  lastName: 'Lead',
  email: 'sample.lead@example.com',
  phone: '+1 (555) 019-2831',
  company: 'Sample Enterprise Inc.',
  source: 'Website Form (Sample)',
  stage: 'New Lead',
  assignedTo: { name: 'Maninder Pal Singh' }
};

export function extractNameComponents(lead) {
  let fullName = lead?.fullName || lead?.name || '';
  let firstName = lead?.firstName || '';
  let lastName = lead?.lastName || '';

  if (fullName && (!firstName || !lastName)) {
    const parts = fullName.trim().split(/\s+/);
    if (!firstName) firstName = parts[0] || '';
    if (!lastName) lastName = parts.slice(1).join(' ') || '';
  }

  if (!fullName) {
    fullName = `${firstName} ${lastName}`.trim();
  }

  return { fullName, firstName, lastName };
}

/**
 * Resolves all variables in a template string dynamically against lead data.
 */
export function resolveVariables(text, lead = null, adminName = 'Maninder Pal Singh') {
  if (!text || typeof text !== 'string') return '';

  const { fullName, firstName, lastName } = extractNameComponents(lead);

  const email = lead?.email || '';
  const phone = lead?.phone || '';
  const company = lead?.company || lead?.metaData?.companyName || '';
  const source = lead?.source || lead?.leadSource || 'Direct Enquiry';
  const stage = lead?.stage || lead?.status || 'New Lead';

  let assignedTo = 'Support Team';
  if (lead?.assignedTo) {
    if (typeof lead.assignedTo === 'object' && lead.assignedTo.name) {
      assignedTo = lead.assignedTo.name;
    } else if (typeof lead.assignedTo === 'string') {
      assignedTo = lead.assignedTo;
    }
  } else {
    assignedTo = adminName;
  }

  const variableMap = {
    '{{first_name}}': firstName || 'there',
    '{{firstName}}': firstName || 'there',

    '{{last_name}}': lastName || '',
    '{{lastName}}': lastName || '',

    '{{full_name}}': fullName || 'Valued Client',
    '{{fullName}}': fullName || 'Valued Client',
    '{{name}}': fullName || 'Valued Client',

    '{{email}}': email,
    '{{phone}}': phone,
    '{{company}}': company,

    '{{lead_source}}': source,
    '{{leadSource}}': source,
    '{{source}}': source,

    '{{lead_stage}}': stage,
    '{{leadStage}}': stage,
    '{{stage}}': stage,

    '{{assigned_to}}': assignedTo,
    '{{assignedTo}}': assignedTo,

    '{{admin_name}}': adminName,
    '{{adminName}}': adminName,
  };

  let rendered = text;
  for (const [tag, val] of Object.entries(variableMap)) {
    const escapedTag = tag.replace(/[{}]/g, '\\$&');
    rendered = rendered.replace(new RegExp(escapedTag, 'g'), val);
  }

  return rendered;
}

/**
 * Detects unsupported variables in text.
 */
export function validateVariables(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(/\{\{([^{}]+)\}\}/g) || [];
  const unsupported = [];

  for (const match of matches) {
    const varName = match.replace(/[\{\}]/g, '').trim();
    if (!VALID_VARIABLE_TAGS.has(varName)) {
      unsupported.push(match);
    }
  }

  return Array.from(new Set(unsupported));
}

/**
 * Generates resolved variable dictionary for preview display.
 */
export function getVariableDictionary(lead = null, adminName = 'Maninder Pal Singh') {
  const { fullName, firstName, lastName } = extractNameComponents(lead);

  let assignedTo = 'Support Team';
  if (lead?.assignedTo) {
    assignedTo = typeof lead.assignedTo === 'object' ? (lead.assignedTo.name || 'Support Team') : lead.assignedTo;
  } else {
    assignedTo = adminName;
  }

  return [
    { label: 'First Name', tag: '{{first_name}}', resolved: firstName || 'there' },
    { label: 'Last Name', tag: '{{last_name}}', resolved: lastName || '(None)' },
    { label: 'Full Name', tag: '{{full_name}}', resolved: fullName || 'Valued Client' },
    { label: 'Email', tag: '{{email}}', resolved: lead?.email || '(None)' },
    { label: 'Phone', tag: '{{phone}}', resolved: lead?.phone || '(None)' },
    { label: 'Lead Source', tag: '{{lead_source}}', resolved: lead?.source || 'Direct Enquiry' },
    { label: 'Lead Stage', tag: '{{lead_stage}}', resolved: lead?.stage || 'New Lead' },
    { label: 'Assigned To', tag: '{{assigned_to}}', resolved: assignedTo },
    { label: 'Admin Name', tag: '{{admin_name}}', resolved: adminName },
  ];
}
