import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UpdateContactCompanyData } from '@/types/business'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; companyId: string }> }
) {
  try {
    const { id, companyId: companyIdParam } = await params
    const contactId = parseInt(id)
    const companyId = parseInt(companyIdParam)
    
    if (isNaN(contactId) || isNaN(companyId)) {
      return NextResponse.json(
        { error: 'Invalid contact ID or company ID' },
        { status: 400 }
      )
    }

    const body: UpdateContactCompanyData = await request.json()

    // Check if relationship exists
    const existingRelationship = await prisma.contactCompany.findUnique({
      where: {
        contactId_companyId: {
          contactId,
          companyId,
        },
      },
    })

    if (!existingRelationship) {
      return NextResponse.json(
        { error: 'Contact company relationship not found' },
        { status: 404 }
      )
    }

    // Update the relationship
    const updatedRelationship = await prisma.contactCompany.update({
      where: {
        contactId_companyId: {
          contactId,
          companyId,
        },
      },
      data: {
        position: body.position,
        description: body.description,
      },
      include: {
        company: true,
      },
    })

    return NextResponse.json(updatedRelationship)
  } catch (error) {
    console.error('Error updating contact company relationship:', error)
    return NextResponse.json(
      { error: 'Failed to update contact company relationship' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; companyId: string }> }
) {
  try {
    const { id, companyId: companyIdParam } = await params
    const contactId = parseInt(id)
    const companyId = parseInt(companyIdParam)
    
    if (isNaN(contactId) || isNaN(companyId)) {
      return NextResponse.json(
        { error: 'Invalid contact ID or company ID' },
        { status: 400 }
      )
    }

    // Check if relationship exists
    const existingRelationship = await prisma.contactCompany.findUnique({
      where: {
        contactId_companyId: {
          contactId,
          companyId,
        },
      },
    })

    if (!existingRelationship) {
      return NextResponse.json(
        { error: 'Contact company relationship not found' },
        { status: 404 }
      )
    }

    // Delete the relationship
    await prisma.contactCompany.delete({
      where: {
        contactId_companyId: {
          contactId,
          companyId,
        },
      },
    })

    return NextResponse.json({ message: 'Company removed from contact successfully' })
  } catch (error) {
    console.error('Error removing company from contact:', error)
    return NextResponse.json(
      { error: 'Failed to remove company from contact' },
      { status: 500 }
      )
  }
}

