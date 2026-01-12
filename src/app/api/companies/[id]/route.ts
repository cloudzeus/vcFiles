import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid company ID' },
        { status: 400 }
      );
    }

    // Cache disabled - fetching directly from database

    // Get company from database
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Cache disabled - skipping cache

    return NextResponse.json({
      success: true,
      company
    });

  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid company ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      sodtype,
      trdr,
      code,
      name,
      afm,
      country,
      address,
      zip,
      city,
      phone01,
      phone02,
      fax,
      jobtypetrd,
      webpage,
      email,
      emailacc,
      irsdata,
      sotitle,
      concent
    } = body;

    // Validate required fields
    if (!sodtype || !code || !name) {
      return NextResponse.json(
        { success: false, error: 'sodtype, code, and name are required' },
        { status: 400 }
      );
    }

    // Validate sodtype
    if (![12, 13].includes(sodtype)) {
      return NextResponse.json(
        { success: false, error: 'sodtype must be 12 (supplier) or 13 (customer)' },
        { status: 400 }
      );
    }

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!existingCompany) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Check if trdr already exists for another company (only if trdr is provided)
    if (trdr && trdr !== existingCompany.trdr) {
      const existingTrdr = await prisma.company.findUnique({
        where: { trdr }
      });

      if (existingTrdr) {
        return NextResponse.json(
          { success: false, error: 'A company with this TRDR already exists' },
          { status: 409 }
        );
      }
    }

    // Check if code already exists for another company of the same sodtype
    if (code !== existingCompany.code || sodtype !== existingCompany.sodtype) {
      const existingCode = await prisma.company.findFirst({
        where: { 
          code: code.trim(),
          sodtype,
          id: { not: companyId }
        }
      });

      if (existingCode) {
        return NextResponse.json(
          { success: false, error: 'A company with this code already exists for the selected type' },
          { status: 409 }
        );
      }
    }

    // Update the company
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        sodtype,
        trdr: trdr || null,
        code: code.trim(),
        name: name.trim(),
        afm: afm?.trim() || null,
        country: country?.trim() || null,
        address: address?.trim() || null,
        zip: zip?.trim() || null,
        city: city?.trim() || null,
        phone01: phone01?.trim() || null,
        phone02: phone02?.trim() || null,
        fax: fax?.trim() || null,
        jobtypetrd: jobtypetrd || null,
        webpage: webpage?.trim() || null,
        email: email?.trim() || null,
        emailacc: emailacc?.trim() || null,
        irsdata: irsdata || null,
        sotitle: sotitle?.trim() || null,
        concent: concent || false,
      }
    });

    // Cache disabled - skipping cache clear

    return NextResponse.json({
      success: true,
      company: updatedCompany,
      message: 'Company updated successfully'
    });

  } catch (error) {
    console.error('Error updating company:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { success: false, error: 'A company with this TRDR or code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid company ID' },
        { status: 400 }
      );
    }

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!existingCompany) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Delete the company
    await prisma.company.delete({
      where: { id: companyId }
    });

    // Cache disabled - skipping cache clear

    return NextResponse.json({
      success: true,
      message: 'Company deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
