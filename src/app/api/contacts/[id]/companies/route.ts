import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateContactCompanyData } from '@/types/business'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contactId = parseInt(id)
    
    if (isNaN(contactId)) {
      return NextResponse.json(
        { error: 'Invalid contact ID' },
        { status: 400 }
      )
    }

    // Get all companies associated with this contact
    const contactCompanies = await prisma.contactCompany.findMany({
      where: { contactId },
      include: {
        company: true,
      },
      orderBy: {
        company: {
          name: 'asc',
        },
      },
    })

    return NextResponse.json(contactCompanies)
  } catch (error) {
    console.error('Error fetching contact companies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact companies' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contactId = parseInt(id)
    
    if (isNaN(contactId)) {
      return NextResponse.json(
        { error: 'Invalid contact ID' },
        { status: 400 }
      )
    }

    const body: CreateContactCompanyData = await request.json()

    // Validate required fields
    if (!body.companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    // Check if contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: body.companyId },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Check if relationship already exists
    const existingRelationship = await prisma.contactCompany.findUnique({
      where: {
        contactId_companyId: {
          contactId,
          companyId: body.companyId,
        },
      },
    })

    if (existingRelationship) {
      return NextResponse.json(
        { error: 'Contact is already associated with this company' },
        { status: 409 }
      )
    }

    // Create the relationship
    const contactCompany = await prisma.contactCompany.create({
      data: {
        contactId,
        companyId: body.companyId,
        position: body.position,
        description: body.description,
      },
      include: {
        company: true,
      },
    })

    return NextResponse.json(contactCompany, { status: 201 })
  } catch (error) {
    console.error('Error creating contact company relationship:', error)
    return NextResponse.json(
      { error: 'Failed to create contact company relationship' },
      { status: 500 }
    )
  }
}

