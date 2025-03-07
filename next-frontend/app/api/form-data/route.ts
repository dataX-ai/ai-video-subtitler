import { NextResponse } from 'next/server';

// You'll need to install Airtable: npm install airtable
import Airtable from 'airtable';

// Validate environment variables
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('Missing required Airtable environment variables');
}

// Add this near the top after environment variable validation
console.log('Airtable Initial Config:', {
  hasApiKey: !!AIRTABLE_API_KEY,
  baseId: AIRTABLE_BASE_ID?.substring(0, 5) + '...', // Show first 5 chars for verification
});

// Initialize Airtable
const airtable = new Airtable({
  apiKey: AIRTABLE_API_KEY
}).base(AIRTABLE_BASE_ID!);

// Add this type definition
type FormType = 'contact' | 'feedback' | 'feature';

// Define tableNames at the top level
const tableNames: Record<FormType, string> = {
  contact: 'Contacts',
  feedback: 'Feedback',
  feature: 'Feature Requests'
};

export async function POST(request: Request) {
  try {
    const { formType, data } = await request.json();

    // Add detailed logging
    console.log('Form submission details:', {
      formType,
      tableName: tableNames[formType as FormType],
      baseId: AIRTABLE_BASE_ID?.substring(0, 5) + '...',
      hasData: !!data
    });

    // Validate form type
    const validFormTypes: FormType[] = ['contact', 'feedback', 'feature'];
    if (!validFormTypes.includes(formType as FormType)) {
      return NextResponse.json(
        { error: 'Invalid form type' },
        { status: 400 }
      );
    }

    // Now TypeScript knows formType is valid

    // Select the appropriate table based on form type
    let table;
    let record;

    switch (formType) {
      case 'contact':
        table = airtable(tableNames[formType as FormType]);
        record = {
          Name: data.name,
          Email: data.email,
          Subject: data.subject,
          Message: data.message,
        };
        break;

      case 'feedback':
        table = airtable(tableNames[formType as FormType]);
        record = {
          Type: data.type,
          Rating: parseInt(data.rating),
          Feedback: data.feedback,
          Email: data.email,
        };
        break;

      case 'feature':
        table = airtable(tableNames[formType as FormType]);
        record = {
          Title: data.title,
          Description: data.description,
          'Use Case': data.useCase,
          Priority: data.priority,
          Email: data.email,
        };
        break;

      default:
        throw new Error('Invalid form type');
    }

    try {
      // Create record in Airtable
      await table.create([{ fields: record }]);
      return NextResponse.json({ success: true });
    } catch (airtableError: any) {
      console.error('Airtable error:', airtableError);
      
      // Check for specific Airtable errors
      if (airtableError.error === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Table not found. Please check your Airtable configuration.' },
          { status: 404 }
        );
      }
      
      throw airtableError; // Re-throw for general error handling
    }

  } catch (error) {
    console.error('Error processing form submission:', error);
    return NextResponse.json(
      { error: 'Failed to process form submission' },
      { status: 500 }
    );
  }
}
