import { NextResponse } from 'next/server';
import Airtable from 'airtable';


type FormType = 'contact' | 'feedback' | 'feature';

const tableNames: Record<FormType, string> = {
  contact: 'Contacts',
  feedback: 'Feedback',
  feature: 'Feature Requests'
};

let airtable: Airtable.Base | null = null;

export async function POST(request: Request) {
  try {

    // Validate environment variables
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing required Airtable environment variables');
    }

    // Initialize Airtable
    if (!airtable) {
      airtable = new Airtable({
        apiKey: AIRTABLE_API_KEY
      }).base(AIRTABLE_BASE_ID!);
    }

    const { formType, data } = await request.json();

    // Validate form type
    const validFormTypes: FormType[] = ['contact', 'feedback', 'feature'];
    if (!validFormTypes.includes(formType as FormType)) {
      return NextResponse.json(
        { error: 'Invalid form type' },
        { status: 400 }
      );
    }

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
