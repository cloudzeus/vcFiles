import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, text, html, shareLink, itemName } = body

    // Validate required fields
    if (!to || !subject || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, text' },
        { status: 400 }
      )
    }

    // Check if the shared item exists and is accessible
    if (shareLink) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sharing?shareLink=${shareLink}`)
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Shared item not found or no longer accessible' },
          { status: 404 }
        )
      }
    }

    // Configure SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Email content
    const emailContent = {
      from: `"G-FILES" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html || text.replace(/\n/g, '<br>'),
    }

    // Send email
    const info = await transporter.sendMail(emailContent)

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}