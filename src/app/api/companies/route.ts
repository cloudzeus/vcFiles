import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const sodtype = searchParams.get('sodtype');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Cache disabled - fetching directly from database

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { afm: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (sodtype) {
      where.sodtype = parseInt(sodtype);
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get companies with pagination
    console.log('🔍 Fetching companies from database...')
    console.log('   Where clause:', JSON.stringify(where))
    console.log('   Order by:', JSON.stringify(orderBy))
    console.log('   Page:', page, 'Limit:', limit)
    
    const [companies, totalCount] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.company.count({ where })
    ]);
    
    console.log('📊 Database results:')
    console.log('   Total count:', totalCount)
    console.log('   Companies found:', companies.length)
    if (companies.length > 0) {
      console.log('   First company:', { id: companies[0].id, name: companies[0].name, code: companies[0].code })
    }

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const result = {
      companies,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    };

    // Cache disabled - skipping cache

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
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

    // Check if trdr already exists (only if trdr is provided)
    if (trdr) {
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

    // Check if code already exists for the same sodtype
    const existingCode = await prisma.company.findFirst({
      where: { 
        code: code.trim(),
        sodtype 
      }
    });

    if (existingCode) {
      return NextResponse.json(
        { success: false, error: 'A company with this code already exists for the selected type' },
        { status: 409 }
      );
    }

    // Create the company
    const company = await prisma.company.create({
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
      company,
      message: 'Company created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating company:', error);
    
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
