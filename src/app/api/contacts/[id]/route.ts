import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UpdateContactData } from '@/types/business'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid contact ID' },
        { status: 400 }
      )
    }

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        companies: {
          include: {
            company: true,
          },
        },
      },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid contact ID' },
        { status: 400 }
      )
    }

    const body: UpdateContactData = await request.json()

    // Check if contact exists
    const existingContact = await prisma.contact.findUnique({
      where: { id },
    })

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Update contact
    const updatedContact = await prisma.contact.update({
      where: { id },
      data: {
        name: body.name,
        title: body.title,
        description: body.description,
        phone: body.phone,
        mobile: body.mobile,
        workPhone: body.workPhone,
        email: body.email,
        address: body.address,
        city: body.city,
        zip: body.zip,
        country: body.country,
      },
    })

    return NextResponse.json(updatedContact)
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid contact ID' },
        { status: 400 }
      )
    }

    // Check if contact exists
    const existingContact = await prisma.contact.findUnique({
      where: { id },
    })

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Delete contact (this will cascade delete ContactCompany relationships)
    await prisma.contact.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Contact deleted successfully' })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}

