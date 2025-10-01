import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = {
      name:
        process.env.NEXT_COMPANY_NAME ||
        process.env.NEXT_PUBLIC_COMPANY_NAME ||
        '',
      vat:
        process.env.NEXT_COMPANY_VAT ||
        process.env.NEXR_COMPANY_VAT ||
        process.env.NEXT_PUBLIC_COMPANY_VAT ||
        '',
      representative:
        process.env.NEXT_COMPANY_REPRESENTATIVE ||
        process.env.NEXT_PUBLIC_COMPANY_REPRESENTATIVE ||
        '',
      address:
        process.env.NEXT_COMPANY_ADDRESS ||
        process.env.NEXT_PUBLIC_COMPANY_ADDRESS ||
        '',
      serial:
        process.env.NEXT_COMPANY_SERIAL ||
        process.env.NEXT_PUBLIC_COMPANY_SERIAL ||
        '',
      issued:
        process.env.NEXT_COMPANY_ISSUED_DATE ||
        process.env.NEXT_PUBLIC_COMPANY_ISSUED_DATE ||
        '',
      vendor:
        process.env.NEXT_VENTOR_NAME ||
        process.env.NEXT_VENDOR_NAME ||
        process.env.NEXT_PUBLIC_VENDOR_NAME ||
        process.env.NEXT_PUBLIC_VENTOR_NAME ||
        '',
    };

    return NextResponse.json({ success: true, company: data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to read env' }, { status: 500 });
  }
}


